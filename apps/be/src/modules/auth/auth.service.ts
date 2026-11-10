/**
 * Auth service.
 *
 * Implements session-based identity: password registration/login, JWT access
 * + refresh tokens (refresh token hashed via SHA-256 and stored in Session), logout /
 * revoke, password reset, and TOTP MFA. Never logs passwords or tokens.
 */

import {
  Injectable,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import * as speakeasy from "speakeasy";
import * as qrcode from "qrcode";
import * as crypto from "crypto";
import { Types, ClientSession } from "mongoose";
import {
  UserRepository,
  SessionRepository,
  WorkspaceRepository,
  MembershipRepository,
  RoleRepository,
  PermissionRepository,
  type PermissionDocument,
} from "@career-intelligence/database";
import { SeedService } from "../seed/seed.service";
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  ROLES,
} from "@career-intelligence/shared";

const SALT_ROUNDS = 12;
const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly workspaces: WorkspaceRepository,
    private readonly memberships: MembershipRepository,
    private readonly roles: RoleRepository,
    private readonly permissions: PermissionRepository,
    private readonly seed: SeedService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private get jwtAccessSecret(): string {
    const secret = this.config.get<string>("JWT_ACCESS_SECRET");
    if (!secret || secret === "change-me-in-production") {
      throw new Error("JWT_ACCESS_SECRET must be configured");
    }
    return secret;
  }

  private get jwtRefreshSecret(): string {
    const secret = this.config.get<string>("JWT_REFRESH_SECRET");
    if (!secret || secret === "change-me-in-production") {
      throw new Error("JWT_REFRESH_SECRET must be configured");
    }
    return secret;
  }

  /**
   * Deterministic SHA-256 hash for high-entropy tokens (sessions, refresh tokens, reset tokens).
   */
  hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Loads permission keys for a user in a workspace by resolving their
   * membership → role → permissions chain.
   */
  async loadUserPermissions(
    userId: string | Types.ObjectId,
    workspaceId: string,
    session?: ClientSession,
  ): Promise<string[]> {
    const membership = await this.memberships.findByUserAndWorkspace(
      userId,
      workspaceId,
      session,
    );
    if (!membership) {
      return [];
    }

    const role = await this.roles.findByName(
      (membership as any).role,
      workspaceId,
      session,
    );
    if (!role) {
      return [];
    }

    const permissionIds: Types.ObjectId[] = (role as any).permissionIds || [];
    const permissions = await Promise.all(
      permissionIds.map((pid) =>
        this.permissions.findById(pid, workspaceId, session),
      ),
    );

    return permissions
      .filter((p): p is PermissionDocument => p !== null)
      .map((p) => p.key);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Register a new user and (optionally) workspace. Creates a default workspace
   * if none is provided, then signs the user in.
   * Atomically executes in a MongoDB transaction with deterministic session propagation.
   */
  async register(input: {
    email: string;
    password: string;
    name?: string;
    workspaceSlug?: string;
  }) {
    return this.users.withTransaction(async (session) => {
      const existing = await this.users.findByEmail(input.email, undefined, session);
      if (existing) {
        throw new ConflictError("User already registered with this email");
      }

      let workspaceId: string;
      if (input.workspaceSlug) {
        const workspace = await this.workspaces.findBySlug(input.workspaceSlug, session);
        if (!workspace) {
          throw new NotFoundError("Workspace", input.workspaceSlug);
        }
        workspaceId = (workspace as any)._id.toString();
      } else {
        const created = await this.workspaces.create(
          {
            slug: input.email.split("@")[0],
            name: input.name || input.email.split("@")[0],
            ownerId: undefined,
          },
          { session }
        );
        workspaceId = (created as any)._id.toString();
      }

      const passwordHash = await this.hashPassword(input.password);
      const user = await this.users.create(
        {
          email: input.email,
          passwordHash,
          workspaceIds: [workspaceId as any],
          emailVerified: false,
          mfaEnabled: false,
          failedLoginAttempts: 0,
        },
        { session }
      );

      if (!user) {
        throw new Error('Failed to create user');
      }

      // Seed default permissions and roles for the workspace
      await this.seed.seedWorkspace(workspaceId, { session });

      // Assign the user the admin role in this workspace
      await this.memberships.create(
        {
          userId: user._id,
          workspaceId: new Types.ObjectId(workspaceId),
          role: ROLES.ADMIN,
        },
        { session }
      );

      const permissions = await this.loadUserPermissions(user._id, workspaceId, session);

      return this.createSession(user as any, workspaceId, permissions, { session });
    });
  }

  /**
   * Login: verify credentials, enforce lockout, create session, issue tokens.
   */
  async login(input: { email: string; password: string }) {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      // Generic failure to avoid user enumeration
      throw new UnauthorizedError("Invalid email or password");
    }

    if (
      (user as any).lockedUntil &&
      new Date() < new Date((user as any).lockedUntil)
    ) {
      throw new ForbiddenError(
        "Account is temporarily locked due to failed login attempts"
      );
    }

    const passwordValid = await this.comparePassword(
      input.password,
      (user as any).passwordHash
    );

    if (!passwordValid) {
      await this.users.incrementFailedLogin((user as any)._id);
      const attempts = ((user as any).failedLoginAttempts || 0) + 1;
      if (attempts >= 5) {
        await this.users.lock(
          (user as any)._id,
          new Date(Date.now() + 15 * 60 * 1000)
        );
      }
      throw new UnauthorizedError("Invalid email or password");
    }

    await this.users.resetFailedLogin((user as any)._id);

    const workspaceId = (user as any).workspaceIds?.[0];
    if (!workspaceId) {
      throw new ForbiddenError("User is not a member of any workspace");
    }

    const permissions = await this.loadUserPermissions(user._id, workspaceId);

    return this.createSession(user as any, workspaceId, permissions);
  }

  async logout(token: string) {
    const tokenHash = this.hashToken(token);
    await this.sessions.revoke(tokenHash);
    return { revoked: true };
  }

  async revokeAllSessions(userId: string) {
    await this.sessions.revokeAllForUser(userId as any);
    return { revoked: true };
  }

  private async createSession(
    user: any,
    workspaceId: string,
    permissions: string[] = [],
    options?: { session?: ClientSession },
  ) {
    const payload = {
      sub: user._id,
      email: user.email,
      workspaceId,
      permissions,
      jti: crypto.randomUUID(),
    };

    const accessToken = this.jwt.sign(payload, {
      secret: this.jwtAccessSecret,
      expiresIn: ACCESS_TTL,
    });

    const refreshPayload = {
      sub: user._id,
      type: "refresh",
      jti: crypto.randomUUID(),
    };
    const refreshToken = this.jwt.sign(refreshPayload, {
      secret: this.jwtRefreshSecret,
      expiresIn: REFRESH_TTL,
    });

    const accessTokenHash = this.hashToken(accessToken);
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const workspaceObjectId = new Types.ObjectId(workspaceId);

    await this.sessions.create(
      {
        userId: user._id,
        workspaceId: workspaceObjectId,
        tokenHash: accessTokenHash,
        refreshTokenHash,
        expiresAt,
      },
      options,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        workspaceId,
        permissions,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.jwtRefreshSecret,
      });
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    if (payload.type !== "refresh") {
      throw new UnauthorizedError("Invalid token type");
    }

    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    const workspaceId = (user as any).workspaceIds?.[0];
    const refreshTokenHash = this.hashToken(refreshToken);

    // Verify session exists and is active
    let session = await this.sessions.findByRefreshTokenHash(refreshTokenHash);
    if (!session) {
      // Fallback check for session list
      const sessions = await this.sessions.findByUser((user as any)._id, workspaceId);
      session = sessions.find((s: any) => s.refreshTokenHash === refreshTokenHash) || null;
    }

    if (!session) {
      throw new UnauthorizedError("Refresh token revoked or invalid");
    }

    // Revoke previous session on refresh (refresh token rotation)
    await this.sessions.revoke(session.tokenHash);

    const permissions = await this.loadUserPermissions(user._id, workspaceId);
    return this.createSession(user as any, workspaceId as string, permissions);
  }

  async passwordResetRequest(email: string) {
    const user = await this.users.findByEmail(email);
    if (!user) {
      // Generic response to avoid enumeration
      return { ok: true };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hash = this.hashToken(token);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.users.updateById((user as any)._id, {
      passwordResetToken: hash,
      passwordResetExpires: expires,
    });

    if (process.env.NODE_ENV !== "production") {
      return { ok: true, resetToken: token };
    }
    return { ok: true };
  }

  async passwordResetConfirm(token: string, newPassword: string) {
    const hash = this.hashToken(token);
    const user = await this.users.findByPasswordResetToken(hash);

    if (!user) {
      throw new UnauthorizedError("Invalid or expired reset token");
    }

    const passwordHash = await this.hashPassword(newPassword);
    await this.users.updateById((user as any)._id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    await this.sessions.revokeAllForUser((user as any)._id);

    return { ok: true };
  }

  async mfaEnroll(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }

    const secret = speakeasy.generateSecret({
      name: `Career Intelligence OS (${(user as any).email})`,
    });

    const otpauth = speakeasy.otpauthURL({
      secret: secret.base32,
      label: (user as any).email,
      issuer: "Career Intelligence OS",
    });

    const qrDataUrl = await qrcode.toDataURL(otpauth);

    await this.users.updateById((user as any)._id, {
      mfaSecret: secret.base32,
      mfaEnabled: false,
    });

    return {
      secret: secret.base32,
      qrDataUrl,
      otpauth,
    };
  }

  async mfaVerify(userId: string, token: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }

    const secret = (user as any).mfaSecret;
    if (!secret) {
      throw new ForbiddenError("MFA not enrolled");
    }

    const valid = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
    });

    if (!valid) {
      throw new UnauthorizedError("Invalid MFA token");
    }

    await this.users.updateById((user as any)._id, { mfaEnabled: true });
    return { verified: true, mfaEnabled: true };
  }

  async mfaDisable(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }
    await this.users.updateById((user as any)._id, {
      mfaEnabled: false,
      mfaSecret: null,
    });
    return { mfaEnabled: false };
  }

  async validateUser(userId: string, workspaceId?: string) {
    const user = await this.users.findById(userId);
    if (!user || (user as any).deletedAt) {
      return null;
    }
    const permissions = workspaceId
      ? await this.loadUserPermissions(user._id, workspaceId)
      : [];
    return {
      id: (user as any)._id,
      email: (user as any).email,
      workspaceIds: (user as any).workspaceIds,
      mfaEnabled: (user as any).mfaEnabled,
      permissions,
    };
  }
}
