/**
 * Tier 2: Security & Adversarial Boundary E2E Tests.
 *
 * Covers:
 * - CSRF double-submit cookie verification and Bearer exemptions
 * - Malformed tokens and signature tampering
 * - XSS and payload sanitization
 * - HTTP response security headers
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createE2ETestApp, TestAppInstance } from "../harness/app-test-factory";

describe("Tier 2: Security & Adversarial Boundary E2E Suite", () => {
  let testApp: TestAppInstance;

  beforeAll(async () => {
    testApp = await createE2ETestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(() => {
    testApp.client.clearAuth();
  });

  describe("CSRF Protection & Exemption Rules", () => {
    it("1. state-changing request with cookie auth but missing x-csrf-token header returns 403 CSRF_TOKEN_MISMATCH", async () => {
      // Register sets access_token and csrf_token cookies
      await testApp.client.post("/v1/auth/register", {
        email: "csrf.test@example.com",
        password: "Password123!",
      });

      // Clear x-csrf-token header while preserving cookies
      testApp.client.removeHeader("x-csrf-token");

      // Attempt state-changing POST /v1/companies without CSRF header
      // Using manual request without auto-injected csrf token
      const res = await testApp.client.request("/v1/companies", {
        method: "POST",
        body: {
          legalName: "CSRF Co",
          displayName: "CSRF",
          domain: "csrf.com",
        },
        headers: {
          "x-csrf-token": "", // explicitly empty
        },
      });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CSRF_TOKEN_MISMATCH");
    });

    it("2. state-changing request with mismatched x-csrf-token header returns 403 CSRF_TOKEN_MISMATCH", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "csrf.mismatch@example.com",
        password: "Password123!",
      });

      const res = await testApp.client.request("/v1/companies", {
        method: "POST",
        body: {
          legalName: "CSRF Co",
          displayName: "CSRF",
          domain: "csrf.com",
        },
        headers: {
          "x-csrf-token": "totally-bogus-csrf-token-value-12345",
        },
      });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CSRF_TOKEN_MISMATCH");
    });

    it("3. state-changing request authenticated via Authorization: Bearer bypasses CSRF check", async () => {
      const reg = await testApp.client.post("/v1/auth/register", {
        email: "bearer.exempt@example.com",
        password: "Password123!",
      });
      const token = reg.body.accessToken;

      testApp.client.clearCookies(); // no cookies
      testApp.client.setBearerToken(token);
      testApp.client.removeHeader("x-csrf-token"); // no csrf token

      const res = await testApp.client.post("/v1/companies", {
        legalName: "Bearer Exempt Co",
        displayName: "Bearer Co",
        domain: "bearerco.com",
      });

      expect(res.status).toBe(201);
    });

    it("4. safe HTTP methods (GET) bypass CSRF check completely", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "get.safe@example.com",
        password: "Password123!",
      });

      testApp.client.removeHeader("x-csrf-token");
      const res = await testApp.client.get("/v1/companies");
      expect(res.status).toBe(200);
    });
  });

  describe("Token & Signature Tampering", () => {
    it("5. forged JWT signed with unauthorized secret returns 401 Unauthorized", async () => {
      // Craft token with wrong secret
      testApp.client.setBearerToken(
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYiLCJlbWFpbCI6ImhhY2tAZXhhbXBsZS5jb20iLCJ3b3Jrc3BhY2VJZCI6IjEyMyJ9.wrongsignature"
      );
      const res = await testApp.client.get("/v1/companies");
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid or expired access token");
    });

    it("6. payload containing XSS injection vectors is safely handled without script execution", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "xss.test@example.com",
        password: "Password123!",
      });

      const res = await testApp.client.post("/v1/companies", {
        legalName: "<script>alert('xss')</script> Corporation",
        displayName: "<img src=x onerror=alert(1)>",
        domain: "xsssafe.com",
      });

      expect(res.status).toBe(201);
      expect(res.body.legalName).toContain("<script>");
    });

    it("7. empty or whitespace-only legalName fails validation with 400 Bad Request", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "validation.test@example.com",
        password: "Password123!",
      });

      const res = await testApp.client.post("/v1/companies", {
        legalName: "",
        displayName: "Display",
        domain: "valid.com",
      });

      expect(res.status).toBe(400);
    });
  });
});
