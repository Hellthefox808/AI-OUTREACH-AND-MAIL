/**
 * Unit tests for CsrfMiddleware.
 * Validates double-submit cookie pattern, safe method exemptions,
 * Bearer token exemption, and token mismatch rejection.
 */

import { CsrfMiddleware } from "./csrf.middleware";
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

describe("CsrfMiddleware", () => {
  let middleware: CsrfMiddleware;
  let req: any;
  let res: any;
  let next: NextFunction;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let cookieMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    middleware = new CsrfMiddleware();
    next = vi.fn() as unknown as NextFunction;
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    cookieMock = vi.fn();

    req = {
      method: "GET",
      path: "/v1/companies",
      headers: {},
      cookies: {},
      ip: "127.0.0.1",
    };

    res = {
      cookie: cookieMock,
      status: statusMock,
    };
  });

  it("should set CSRF cookie and allow safe HTTP methods (GET, HEAD, OPTIONS)", () => {
    req.method = "GET";
    middleware.use(req as Request, res as Response, next);

    expect(cookieMock).toHaveBeenCalledWith(
      "csrf_token",
      expect.any(String),
      expect.objectContaining({ path: "/" })
    );
    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it("should exempt requests authenticated via Bearer token", () => {
    req.method = "POST";
    req.path = "/v1/companies";
    req.headers = {
      authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy",
    };

    middleware.use(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it("should exempt public authentication endpoints like /v1/auth/login", () => {
    req.method = "POST";
    req.path = "/v1/auth/login";

    middleware.use(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it("should reject state-changing request (POST) with 403 when CSRF header is missing", () => {
    req.method = "POST";
    req.path = "/v1/companies";
    req.cookies = { csrf_token: "valid-cookie-token" };
    req.headers = {}; // Missing x-csrf-token

    middleware.use(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        code: "CSRF_TOKEN_MISMATCH",
      })
    );
  });

  it("should reject state-changing request (PATCH) with 403 when CSRF header mismatches cookie token", () => {
    req.method = "PATCH";
    req.path = "/v1/recruiters/123";
    req.cookies = { csrf_token: "expected-token" };
    req.headers = { "x-csrf-token": "attacker-provided-token" };

    middleware.use(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(403);
  });

  it("should allow state-changing request (POST) when CSRF header matches cookie token", () => {
    req.method = "POST";
    req.path = "/v1/jobs";
    const token = "secure-random-csrf-token-123";
    req.cookies = { csrf_token: token };
    req.headers = { "x-csrf-token": token };

    middleware.use(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });
});
