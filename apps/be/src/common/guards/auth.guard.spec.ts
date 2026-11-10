/**
 * Unit tests for AuthGuard.
 */

import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../modules/auth/auth.service", () => ({
  AuthService: vi.fn().mockImplementation(() => ({
    validateUser: vi.fn(),
  })),
}));

describe("AuthGuard", () => {
  let guard: AuthGuard;
  let reflector: any;
  let jwt: any;
  let config: any;
  let auth: any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(() => false),
    };
    jwt = {
      verify: vi.fn(),
    } as any;
    config = {
      get: vi.fn((_key: string) => "test-secret"),
    } as any;
    auth = {
      validateUser: vi.fn(),
    } as any;

    guard = new AuthGuard(reflector as any, jwt as any, config as any, auth as any);
  });

  it("should bypass authentication when endpoint is decorated with @Public()", async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ cookies: {} }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it("should throw UnauthorizedException when no token", async () => {
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ cookies: {}, headers: {} }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it("should throw UnauthorizedException when token invalid", async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error("invalid");
    });
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ cookies: { access_token: "bad-token" }, headers: {} }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it("should attach user and return true when valid cookie token", async () => {
    jwt.verify.mockReturnValue({ sub: "user-1", workspaceId: "ws-1" });
    auth.validateUser.mockResolvedValue({
      id: "user-1",
      email: "alice@example.com",
      workspaceIds: ["ws-1"],
      mfaEnabled: false,
    });
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ cookies: { access_token: "good-token" }, headers: {} }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it("should support Authorization: Bearer token header", async () => {
    jwt.verify.mockReturnValue({ sub: "user-1", workspaceId: "ws-1" });
    auth.validateUser.mockResolvedValue({
      id: "user-1",
      email: "alice@example.com",
      workspaceIds: ["ws-1"],
      mfaEnabled: false,
    });
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ cookies: {}, headers: { authorization: "Bearer bearer-token-xyz" } }),
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it("should throw when user not found", async () => {
    jwt.verify.mockReturnValue({ sub: "user-1", workspaceId: "ws-1" });
    auth.validateUser.mockResolvedValue(null);
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ cookies: { access_token: "good-token" }, headers: {} }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });
});
