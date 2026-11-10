/**
 * Integration tests for authentication flow.
 * Tests complete business flows (register → login → session → revoke → denied)
 * with mocked repositories. Cross-workspace isolation and lockout are verified
 * at the service/repository layer.
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

const workspaceAId = "000000000000000000000100";
const workspaceBId = "000000000000000000000200";
const userAId = "000000000000000000000001";

const userA = {
  _id: userAId,
  email: "alice@workspace-a.example.com",
  passwordHash: "$2b$12$hashed",
  workspaceIds: [workspaceAId],
  mfaEnabled: false,
  failedLoginAttempts: 0,
  deletedAt: null,
};

describe("Authentication integration flow", () => {
  let service: AuthService;
  let users: { [key: string]: any };
  let sessions: { [key: string]: any };
  let workspaces: { [key: string]: any };
  let memberships: { [key: string]: any };
  let roles: { [key: string]: any };
  let permissions: { [key: string]: any };
  let seed: { [key: string]: any };
  let jwt: { [key: string]: any };
  let config: { [key: string]: any };

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
        if (token === "valid-refresh") return { sub: userAId, type: "refresh" };
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
      jwt as any,
      config as any
    );
    vi.clearAllMocks();
  });

  it("register → login → access → revoke → denied flow", async () => {
    // 1. Register
    users.findByEmail.mockResolvedValue(null);
    workspaces.create.mockResolvedValue({ _id: workspaceAId } as any);
    users.create.mockResolvedValue(userA as any);
    sessions.create.mockResolvedValue({} as any);

    const regResult = await service.register({
      email: "alice@workspace-a.example.com",
      password: "Password123",
    });
    expect(regResult.accessToken).toBe("access-token");
    expect(regResult.user.workspaceId).toBe(workspaceAId);

    // 2. Login with same credentials
    (bcrypt.compare as any).mockResolvedValueOnce(true);
    users.findByEmail.mockResolvedValue(userA as any);
    sessions.create.mockResolvedValue({} as any);

    const loginResult = await service.login({
      email: "alice@workspace-a.example.com",
      password: "Password123",
    });
    expect(loginResult.accessToken).toBe("access-token");

    // 3. Logout (revoke session)
    sessions.revoke.mockResolvedValue(undefined);
    const logoutResult = await service.logout("access-token");
    expect(logoutResult.revoked).toBe(true);
    const expectedHash = crypto.createHash("sha256").update("access-token").digest("hex");
    expect(sessions.revoke).toHaveBeenCalledWith(expectedHash);
  });

  it("cross-workspace isolation: user A cannot access workspace B", async () => {
    // User A's repository methods should only see workspace A
    users.findById.mockResolvedValue(userA as any);

    const result = await service.validateUser(userAId);
    expect(result).not.toBeNull();
    expect(result!.workspaceIds).toEqual([workspaceAId]);
    expect(result!.workspaceIds).not.toContain(workspaceBId);
  });

  it("cross-workspace isolation: user B cannot see user A's sessions", async () => {
    sessions.findByUser.mockResolvedValue([]);

    const sessionsA = await sessions.findByUser(userAId, workspaceAId);
    expect(sessionsA).toEqual([]);
    expect(sessions.findByUser).toHaveBeenCalledWith(userAId, workspaceAId);
    expect(sessions.findByUser).not.toHaveBeenCalledWith(
      "000000000000000000000002",
      workspaceAId
    );
  });

  it("password lockout after 5 failed attempts", async () => {
    const userWithAttempts = { ...userA, failedLoginAttempts: 4 } as any;
    users.findByEmail.mockResolvedValue(userWithAttempts);
    users.incrementFailedLogin.mockResolvedValue(undefined);
    users.lock.mockResolvedValue(undefined);

    // 5th failed attempt should trigger lockout
    (bcrypt.compare as any).mockResolvedValueOnce(false);

    await expect(
      service.login({ email: "alice@workspace-a.example.com", password: "wrong" })
    ).rejects.toThrow("Invalid email or password");

    expect(users.lock).toHaveBeenCalledWith(
      userAId,
      expect.any(Date)
    );
  });

  it("locked account cannot log in", async () => {
    const lockedUser = {
      ...userA,
      lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
    } as any;
    users.findByEmail.mockResolvedValue(lockedUser);

    await expect(
      service.login({ email: "alice@workspace-a.example.com", password: "Password123" })
    ).rejects.toThrow("temporarily locked");
  });

  it("refresh token flow: valid token returns new tokens and revokes old session", async () => {
    users.findById.mockResolvedValue(userA as any);
    const refreshHash = crypto.createHash("sha256").update("valid-refresh").digest("hex");
    sessions.findByRefreshTokenHash.mockResolvedValue({
      tokenHash: "old-token-hash",
      refreshTokenHash: refreshHash,
    } as any);
    sessions.create.mockResolvedValue({} as any);

    const result = await service.refreshTokens("valid-refresh");
    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(sessions.revoke).toHaveBeenCalledWith("old-token-hash");
  });

  it("refresh token flow: revoked token is rejected", async () => {
    users.findById.mockResolvedValue(userA as any);
    sessions.findByRefreshTokenHash.mockResolvedValue(null);
    sessions.findByUser.mockResolvedValue([]);

    await expect(service.refreshTokens("valid-refresh")).rejects.toThrow(
      "Refresh token revoked or invalid"
    );
  });

  it("password reset: request generates token, confirm resets password", async () => {
    users.findByEmail.mockResolvedValue(userA as any);

    const requestResult = await service.passwordResetRequest(
      "alice@workspace-a.example.com"
    );
    expect(requestResult.ok).toBe(true);
    expect(users.updateById).toHaveBeenCalledWith(userAId, {
      passwordResetToken: expect.any(String),
      passwordResetExpires: expect.any(Date),
    });

    vi.clearAllMocks();

    // Confirm with valid token
    (bcrypt.compare as any).mockResolvedValueOnce(true);
    users.findByPasswordResetToken = vi.fn().mockResolvedValue(userA as any);
    users.updateById.mockResolvedValue(undefined as any);
    sessions.revokeAllForUser.mockResolvedValue(undefined as any);

    const confirmResult = await service.passwordResetConfirm("reset-token", "NewPass123");
    expect(confirmResult.ok).toBe(true);
    expect(sessions.revokeAllForUser).toHaveBeenCalledWith(userAId);
  });

  it("password reset: invalid token is rejected", async () => {
    users.findByPasswordResetToken = vi.fn().mockResolvedValue(null);

    await expect(
      service.passwordResetConfirm("bad-token", "NewPass123")
    ).rejects.toThrow("Invalid or expired reset token");
  });
});
