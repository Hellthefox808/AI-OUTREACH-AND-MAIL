/**
 * Unit tests for AuthService.
 * Dependencies are constructed directly (no NestJS DI) and the
 * @career-intelligence/database module is mocked to avoid mongoose schema
 * compilation at runtime.
 */

import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { AuthService } from "./auth.service";

vi.mock("bcryptjs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("bcryptjs")>();
  return {
    ...actual,
    hash: vi.fn(() => "$2b$12$fakehash"),
    compareSync: vi.fn(() => true),
    compare: vi.fn(async () => false),
  };
});

vi.mock("@career-intelligence/database", () => ({
  UserRepository: vi.fn(),
  SessionRepository: vi.fn(),
  WorkspaceRepository: vi.fn(),
}));

const userId = "000000000000000000000001";
const workspaceId = "000000000000000000000100";
const user = {
  _id: userId,
  email: "alice@example.com",
  passwordHash: "$2b$12$hashed",
  workspaceIds: [workspaceId],
  mfaEnabled: false,
  failedLoginAttempts: 0,
  deletedAt: null,
};

describe("AuthService", () => {
  let service: AuthService;
  let users: { [key: string]: any };
  let sessions: { [key: string]: any };
  let workspaces: { [key: string]: any };
  let memberships: { [key: string]: any };
  let roles: { [key: string]: any };
  let permissions: { [key: string]: any };
  let seed: { [key: string]: any };
  let jwt: any;
  let config: any;

  beforeEach(() => {
    users = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateById: vi.fn(),
      incrementFailedLogin: vi.fn(),
      resetFailedLogin: vi.fn(),
      lock: vi.fn(),
      withTransaction: vi.fn(async (cb: (session: any) => Promise<any>) => cb(null)),
    };
    sessions = {
      create: vi.fn(),
      revoke: vi.fn(),
      revokeAllForUser: vi.fn(),
      findByUser: vi.fn(),
      findByRefreshTokenHash: vi.fn(),
    };
    workspaces = {
      findBySlug: vi.fn(),
      create: vi.fn(),
    };
    memberships = {
      findByUserAndWorkspace: vi.fn(),
      create: vi.fn(),
    };
    roles = {
      findByName: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateById: vi.fn(),
    };
    permissions = {
      findByKey: vi.fn(),
      findById: vi.fn(),
      findByWorkspace: vi.fn(),
      create: vi.fn(),
    };
    seed = {
      seedWorkspace: vi.fn(),
    };
    jwt = {
      sign: vi.fn((_payload: any, _opts: any) =>
        _opts.secret === "access-secret" ? "access-token" : "refresh-token"
      ),
      verify: vi.fn((token: string, _opts: any) => {
        if (token === "valid-refresh") return { sub: userId, type: "refresh" };
        throw new Error("invalid");
      }),
    } as any;
    config = {
      get: (key: string) => {
        if (key === "JWT_ACCESS_SECRET") return "access-secret";
        if (key === "JWT_REFRESH_SECRET") return "refresh-secret";
        return undefined;
      },
    } as any;

    service = new AuthService(
      users as any,
      sessions as any,
      workspaces as any,
      memberships as any,
      roles as any,
      permissions as any,
      seed as any,
      jwt,
      config
    );

    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should return tokens for valid credentials", async () => {
      users.findByEmail.mockResolvedValue(user as any);
      (bcrypt.compare as any).mockResolvedValueOnce(true);
      sessions.create.mockResolvedValue({} as any);

      const result = await service.login({
        email: "alice@example.com",
        password: "Password123",
      });

      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
      expect(result.user.email).toBe("alice@example.com");
    });

    it("should throw UnauthorizedError for wrong password", async () => {
      users.findByEmail.mockResolvedValue(user as any);
      users.incrementFailedLogin.mockResolvedValue(undefined);

      await expect(
        service.login({ email: "alice@example.com", password: "wrong" })
      ).rejects.toThrow("Invalid email or password");
    });

    it("should throw UnauthorizedError for unknown email (no enumeration)", async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: "nope@example.com", password: "x" })
      ).rejects.toThrow("Invalid email or password");
    });
  });

  describe("register", () => {
    it("should create user, workspace, and session", async () => {
      users.findByEmail.mockResolvedValue(null);
      workspaces.create.mockResolvedValue({ _id: workspaceId } as any);
      users.create.mockResolvedValue(user as any);
      sessions.create.mockResolvedValue({} as any);

      const result = await service.register({
        email: "bob@example.com",
        password: "Password123",
      });

      expect(result.accessToken).toBe("access-token");
      expect(users.create).toHaveBeenCalled();
      expect(workspaces.create).toHaveBeenCalled();
    });

    it("should throw ConflictError for duplicate email", async () => {
      users.findByEmail.mockResolvedValue(user as any);

      await expect(
        service.register({ email: "alice@example.com", password: "Password123" })
      ).rejects.toThrow("already registered");
    });
  });

  describe("logout", () => {
    it("should revoke session using SHA-256 hash", async () => {
      sessions.revoke.mockResolvedValue(undefined);
      const result = await service.logout("access-token");
      expect(result.revoked).toBe(true);
      const expectedHash = crypto.createHash("sha256").update("access-token").digest("hex");
      expect(sessions.revoke).toHaveBeenCalledWith(expectedHash);
    });
  });

  describe("revokeAllSessions", () => {
    it("should revoke all sessions for user", async () => {
      sessions.revokeAllForUser.mockResolvedValue(undefined);
      const result = await service.revokeAllSessions(userId);
      expect(result.revoked).toBe(true);
      expect(sessions.revokeAllForUser).toHaveBeenCalledWith(userId);
    });
  });

  describe("refreshTokens", () => {
    it("should return new tokens for valid refresh token", async () => {
      users.findById.mockResolvedValue(user as any);
      const refreshHash = crypto.createHash("sha256").update("valid-refresh").digest("hex");
      sessions.findByRefreshTokenHash.mockResolvedValue({
        tokenHash: "old-access-hash",
        refreshTokenHash: refreshHash,
      } as any);
      sessions.create.mockResolvedValue({} as any);

      const result = await service.refreshTokens("valid-refresh");
      expect(result.accessToken).toBe("access-token");
      expect(sessions.revoke).toHaveBeenCalledWith("old-access-hash");
    });

    it("should throw for invalid refresh token", async () => {
      await expect(service.refreshTokens("invalid")).rejects.toThrow(
        "Invalid or expired refresh token"
      );
    });
  });

  describe("mfa", () => {
    it("should enroll and return secret + qr", async () => {
      users.findById.mockResolvedValue(user as any);
      users.updateById.mockResolvedValue(undefined as any);

      const result = await service.mfaEnroll(userId);
      expect(result.secret).toBeDefined();
      expect(result.qrDataUrl).toBeDefined();
      expect(users.updateById).toHaveBeenCalledWith(userId, {
        mfaSecret: expect.any(String),
        mfaEnabled: false,
      });
    });

    it("should throw when MFA not enrolled", async () => {
      users.findById.mockResolvedValue(user as any);
      await expect(service.mfaVerify(userId, "000000")).rejects.toThrow(
        "MFA not enrolled"
      );
    });

    it("should disable MFA", async () => {
      users.findById.mockResolvedValue(user as any);
      users.updateById.mockResolvedValue(undefined as any);
      const result = await service.mfaDisable(userId);
      expect(result.mfaEnabled).toBe(false);
    });
  });
});
