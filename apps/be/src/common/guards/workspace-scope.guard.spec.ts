/**
 * Unit tests for WorkspaceScopeGuard.
 * Validates tenant isolation, workspace membership boundary enforcement,
 * and bypass decorators.
 */

import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { WorkspaceScopeGuard } from "./workspace-scope.guard";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("WorkspaceScopeGuard", () => {
  let guard: WorkspaceScopeGuard;
  let reflector: {
    getAllAndOverride: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    };
    guard = new WorkspaceScopeGuard(reflector as unknown as Reflector);
  });

  function createMockContext(
    user?: Record<string, unknown>,
    params?: Record<string, unknown>,
    body?: Record<string, unknown>,
    query?: Record<string, unknown>
  ): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params: params || {},
          body: body || {},
          query: query || {},
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it("should bypass workspace check when endpoint is decorated with @Public()", () => {
    reflector.getAllAndOverride.mockReturnValueOnce(true); // isPublic = true
    const ctx = createMockContext();

    const allowed = guard.canActivate(ctx);
    expect(allowed).toBe(true);
  });

  it("should bypass workspace check when route is decorated with @WorkspaceAgnostic()", () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false) // isPublic = false
      .mockReturnValueOnce(true); // workspaceAgnostic = true
    const ctx = createMockContext();

    const allowed = guard.canActivate(ctx);
    expect(allowed).toBe(true);
  });

  it("should throw ForbiddenException when user is unauthenticated or missing", () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);
    const ctx = createMockContext(undefined);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow(/Authentication required/);
  });

  it("should allow access when request targets no workspaceId in params, body, or query", () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);
    const ctx = createMockContext({ id: "u1", workspaceIds: ["ws_1"] });

    const allowed = guard.canActivate(ctx);
    expect(allowed).toBe(true);
  });

  it("should allow access when workspaceId in route params belongs to user", () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);
    const ctx = createMockContext(
      { id: "u1", workspaceIds: ["ws_alpha", "ws_beta"] },
      { workspaceId: "ws_alpha" }
    );

    const allowed = guard.canActivate(ctx);
    expect(allowed).toBe(true);
  });

  it("should allow access when workspaceId in body belongs to user", () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);
    const ctx = createMockContext(
      { id: "u1", workspaceIds: ["ws_alpha"] },
      undefined,
      { workspaceId: "ws_alpha" }
    );

    const allowed = guard.canActivate(ctx);
    expect(allowed).toBe(true);
  });

  it("should allow access when workspaceId in query string belongs to user", () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);
    const ctx = createMockContext(
      { id: "u1", workspaceIds: ["ws_alpha"] },
      undefined,
      undefined,
      { workspaceId: "ws_alpha" }
    );

    const allowed = guard.canActivate(ctx);
    expect(allowed).toBe(true);
  });

  it("should reject access with ForbiddenException when user is not a member of target workspace", () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);
    const ctx = createMockContext(
      { id: "u1", workspaceIds: ["ws_alpha"] },
      { workspaceId: "ws_intruder_target" }
    );

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow(/Access denied to this workspace/);
  });

  it("should handle ObjectId-like objects with toString in user workspaceIds", () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);
    const mockObjectId = { toString: () => "672f9a12bcf86cd799439011" };
    const ctx = createMockContext(
      { id: "u1", workspaceIds: [mockObjectId] },
      { workspaceId: "672f9a12bcf86cd799439011" }
    );

    const allowed = guard.canActivate(ctx);
    expect(allowed).toBe(true);
  });
});
