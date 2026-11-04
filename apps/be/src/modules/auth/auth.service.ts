/**
 * Auth service.
 *
 * Implements session-based identity: password registration/login, JWT access
 * + refresh tokens (refresh token hashed and stored in Session), logout /
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
import { Types } from "mongoose";
import {
  UserRepository,
  SessionRepository,
  WorkspaceRepository,
} from "@career-intelligence/database";
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
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

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Register a new user and (optionally) workspace. Creates a default workspace
   * if none is provided, then signs the user in.
   */
  async register(input: {
    email: string;
    password: string;
    name?: string;
    workspaceSlug?: string;
  }) {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("User already registered with this email");
    }

    let workspaceId: string;
    if (input.workspaceSlug) {
      const workspace = await this.workspaces.findBySlug(input.workspaceSlug);
      if (!workspace) {
        throw new NotFoundError("Workspace", input.workspaceSlug);
      }
      workspaceId = (workspace as any)._id.toString();
    } else {
      const created = await this.workspaces.create({
        slug: input.email.split("@")[0],
        name: input.name || input.email.split("@")[0],
        ownerId: undefined,
      });
      workspaceId = (created as any)._id.toString();
    }

    const passwordHash = await this.hashPassword(input.password);
    const user = await this.users.create({
      email: input.email,
      passwordHash,
      workspaceIds: [workspaceId as any],
      emailVerified: false,
      mfaEnabled: false,
      failedLoginAttempts: 0,
    });

    return this.createSession(user as any, workspaceId);
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

    return this.createSession(user as any, workspaceId as string);
  }

  async logout(tokenHash: string) {
    await this.sessions.revoke(tokenHash);
    return { revoked: true };
  }

  async revokeAllSessions(userId: string) {
    await this.sessions.revokeAllForUser(userId as any);
    return { revoked: true };
  }

  private async createSession(user: any, workspaceId: string) {
    const payload = {
      sub: user._id,
      email: user.email,
      workspaceId,
    };

    const accessToken = this.jwt.sign(payload, {
      secret: this.jwtAccessSecret,
      expiresIn: ACCESS_TTL,
    });

    const refreshPayload = { sub: user._id, type: "refresh" };
    const refreshToken = this.jwt.sign(refreshPayload, {
      secret: this.jwtRefreshSecret,
      expiresIn: REFRESH_TTL,
    });

    const refreshTokenHash = await this.hashPassword(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const workspaceObjectId = new Types.ObjectId(workspaceId);

    await this.sessions.create({
      userId: user._id,
      workspaceId: workspaceObjectId,
      tokenHash: accessToken,
      refreshTokenHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        workspaceId,
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
    const sessions = await this.sessions.findByUser(
      (user as any)._id,
      workspaceId as string
    );
    const valid = sessions.some((s: any) =>
      bcrypt.compareSync(refreshToken, (s as any).refreshTokenHash)
    );
    if (!valid) {
      throw new UnauthorizedError("Refresh token revoked or invalid");
    }

    return this.createSession(user as any, workspaceId as string);
  }

  async passwordResetRequest(email: string) {
    const user = await this.users.findByEmail(email);
    if (!user) {
      // Generic response to avoid enumeration
      return { ok: true };
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hash = await this.hashPassword(token);
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
    const hash = await this.hashPassword(token);
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

  async validateUser(userId: string) {
    const user = await this.users.findById(userId);
    if (!user || (user as any).deletedAt) {
      return null;
    }
    return {
      id: (user as any)._id,
      email: (user as any).email,
      workspaceIds: (user as any).workspaceIds,
      mfaEnabled: (user as any).mfaEnabled,
    };
  }
}
