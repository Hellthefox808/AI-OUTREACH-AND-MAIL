/**
 * CSRF protection middleware — double-submit cookie pattern.
 *
 * Sets a CSRF token in a SameSite=strict cookie and requires the same token
 * in the X-CSRF-Token header for state-changing methods (POST, PUT, PATCH,
 * DELETE). Safe methods (GET, HEAD, OPTIONS) are exempt.
 *
 * The CSRF cookie is not HTTP-only so the frontend can read it and include it
 * in the header; it is SameSite=strict to prevent cross-site submission.
 */

import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const EXEMPT_PATHS = ["/v1/auth/login", "/v1/auth/register"];

function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    // Always (re)issue the CSRF cookie so clients have a current token
    const existingToken = req.cookies?.[CSRF_COOKIE_NAME];
    const csrfToken = existingToken ?? generateCsrfToken();

    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false, // frontend must read it to send in header
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    // Exempt safe methods and auth endpoints (no session yet)
    if (!STATE_CHANGING_METHODS.has(req.method)) {
      return next();
    }

    if (EXEMPT_PATHS.some((p) => req.path.startsWith(p))) {
      return next();
    }

    const headerToken = req.headers[CSRF_HEADER_NAME.toLowerCase()] as
      | string
      | undefined;

    if (!headerToken || headerToken !== csrfToken) {
      this.logger.warn(
        `CSRF token mismatch for ${req.method} ${req.path} from ${req.ip}`,
      );
      res.status(403).json({
        statusCode: 403,
        code: "CSRF_TOKEN_MISMATCH",
        message: "CSRF token validation failed",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  }
}
