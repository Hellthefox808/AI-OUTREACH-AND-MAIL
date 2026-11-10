/**
 * Unit tests for RbacGuard.
 * Validates role-based permission enforcement, default-deny invariants,
 * and public route bypass mechanisms.
 */

import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RbacGuard } from "./rbac.guard";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("RbacGuard", () => {
  let guard: RbacGuard;
  let reflector: {
    getAllAndOverride: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    };
    guard = new RbacGuard(reflector as unknown as Reflector);
  });

  function createMockContext(user?: Record<string, unknown>): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it("should bypass RBAC evaluation when endpoint is decorated with @Public()", () => {
    reflector.getAllAndOverride.mockReturnValueOnce(true); // isPublic = true
    const ctx = createMockContext();

    const allowed = guard.canActivate(ctx);
    expect(allowed).toBe(true);
  });

  it("should allow access when no permissions are specified on route", () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false) // isPublic = false
      .mockReturnValueOnce(undefined); // requiredPermissions = undefined
    const ctx = createMockContext({ id: "u1" });

    const allowed = guard.canActivate(ctx);
    expect(allowed).toBe(true);
  });

  it("should allow access when required permissions list is empty", () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce([]);
    const ctx = createMockContext({ id: "u1" });

    const allowed = guard.canActivate(ctx);
    expect(allowed).toBe(true);
  });

  it("should throw ForbiddenException when user is unauthenticated or missing", () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(["company:read"]);
    const ctx = createMockContext(undefined); // no user

    expect(() => guard.canActivate(ctx)).toThrowError(/Authentication required/);
  });

  it("should throw ForbiddenException when user lacks one or more required permissions", () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(["company:read", "company:write"]);
    const ctx = createMockContext({
      id: "u1",
      permissions: ["company:read"], // missing company:write
    });

    expect(() => guard.canActivate(ctx)).toThrowError(/Insufficient permissions: company:write/);
  });

  it("should allow access when user possesses exact required permissions", () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(["recruiter:read", "recruiter:write"]);
    const ctx = createMockContext({
      id: "u1",
      permissions: ["recruiter:read", "recruiter:write"],
    });

    const allowed = guard.canActivate(ctx);
    expect(allowed).toBe(true);
  });

  it("should allow access when user has a superset of required permissions", () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(["job:read"]);
    const ctx = createMockContext({
      id: "u1",
      permissions: ["job:read", "job:write", "admin:all"],
    });

    const allowed = guard.canActivate(ctx);
    expect(allowed).toBe(true);
  });
});
