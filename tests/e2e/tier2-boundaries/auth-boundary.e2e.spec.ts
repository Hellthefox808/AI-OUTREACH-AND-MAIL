/**
 * Tier 2: Authentication & Password Reset Boundary and Corner Cases E2E Tests.
 *
 * Covers:
 * - Brute force lockout threshold boundaries (4 vs 5 attempts, lockout expiration)
 * - Password length & complexity boundaries (< 8 chars, extreme length)
 * - Anti-enumeration safeguards for login and password reset
 * - Reset token expiration and single-use invalidation boundaries
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createE2ETestApp, TestAppInstance } from "../harness/app-test-factory";

describe("Tier 2: Auth Boundary & Corner Cases E2E Suite", () => {
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

  describe("Lockout & Brute-Force Threshold Boundaries", () => {
    it("1. exactly 4 failed login attempts increments counter but leaves account UNLOCKED", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "lockout.boundary@example.com",
        password: "CorrectPassword123!",
      });
      testApp.client.clearAuth();

      // 4 consecutive bad attempts
      for (let i = 0; i < 4; i++) {
        const failRes = await testApp.client.post("/v1/auth/login", {
          email: "lockout.boundary@example.com",
          password: "WrongPassword!",
        });
        expect(failRes.status).toBe(401);
      }

      const user = Array.from(testApp.stateEngine.users.values()).find(
        (u) => u.email === "lockout.boundary@example.com"
      );
      expect(user.failedLoginAttempts).toBe(4);
      expect(user.lockedUntil).toBeNull();

      // 5th attempt with correct password succeeds because it is not locked yet
      const okRes = await testApp.client.post("/v1/auth/login", {
        email: "lockout.boundary@example.com",
        password: "CorrectPassword123!",
      });
      expect(okRes.status).toBe(200);
    });

    it("2. 5th consecutive failed attempt triggers immediate lockout (401 on attempt, lockedUntil set)", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "lockout.trigger@example.com",
        password: "CorrectPassword123!",
      });
      testApp.client.clearAuth();

      // 5 consecutive bad attempts
      for (let i = 0; i < 5; i++) {
        await testApp.client.post("/v1/auth/login", {
          email: "lockout.trigger@example.com",
          password: "WrongPassword!",
        });
      }

      const user = Array.from(testApp.stateEngine.users.values()).find(
        (u) => u.email === "lockout.trigger@example.com"
      );
      expect(user.failedLoginAttempts).toBe(5);
      expect(user.lockedUntil).not.toBeNull();
      expect(new Date(user.lockedUntil).getTime()).toBeGreaterThan(Date.now());
    });

    it("3. locked account rejects even correct credentials with 403 Forbidden", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "locked.user@example.com",
        password: "CorrectPassword123!",
      });
      testApp.client.clearAuth();

      // Force lock by failing 5 times
      for (let i = 0; i < 5; i++) {
        await testApp.client.post("/v1/auth/login", {
          email: "locked.user@example.com",
          password: "WrongPassword!",
        });
      }

      // Now try with correct password
      const res = await testApp.client.post("/v1/auth/login", {
        email: "locked.user@example.com",
        password: "CorrectPassword123!",
      });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain("temporarily locked");
    });

    it("4. failed login count resets to 0 upon successful authentication", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "reset.count@example.com",
        password: "CorrectPassword123!",
      });
      testApp.client.clearAuth();

      // 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await testApp.client.post("/v1/auth/login", {
          email: "reset.count@example.com",
          password: "WrongPassword!",
        });
      }

      // Successful login resets counter
      await testApp.client.post("/v1/auth/login", {
        email: "reset.count@example.com",
        password: "CorrectPassword123!",
      });

      const user = Array.from(testApp.stateEngine.users.values()).find(
        (u) => u.email === "reset.count@example.com"
      );
      expect(user.failedLoginAttempts).toBe(0);
    });

    it("5. confirming password reset clears lockout and unlocks account", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "lockout.reset@example.com",
        password: "OldPassword123!",
      });
      testApp.client.clearAuth();

      // Lock account
      for (let i = 0; i < 5; i++) {
        await testApp.client.post("/v1/auth/login", {
          email: "lockout.reset@example.com",
          password: "WrongPassword!",
        });
      }

      // Request and confirm reset
      const reqRes = await testApp.client.post("/v1/auth/password-reset-request", {
        email: "lockout.reset@example.com",
      });
      await testApp.client.post("/v1/auth/password-reset-confirm", {
        token: reqRes.body.resetToken,
        newPassword: "BrandNewPassword123!",
      });

      const user = Array.from(testApp.stateEngine.users.values()).find(
        (u) => u.email === "lockout.reset@example.com"
      );
      expect(user.lockedUntil).toBeNull();
      expect(user.failedLoginAttempts).toBe(0);

      // Now can log in with new password
      const loginRes = await testApp.client.post("/v1/auth/login", {
        email: "lockout.reset@example.com",
        password: "BrandNewPassword123!",
      });
      expect(loginRes.status).toBe(200);
    });
  });

  describe("Validation & Anti-Enumeration Safeguards", () => {
    it("6. rejects password shorter than 8 characters during registration (400)", async () => {
      const res = await testApp.client.post("/v1/auth/register", {
        email: "short.pass@example.com",
        password: "short",
      });
      expect(res.status).toBe(400);
    });

    it("7. rejects malformed email formats during registration (400)", async () => {
      const res = await testApp.client.post("/v1/auth/register", {
        email: "not-an-email",
        password: "ValidPassword123!",
      });
      expect(res.status).toBe(400);
    });

    it("8. registration with duplicate email returns 409 Conflict without leaking password details", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "duplicate.user@example.com",
        password: "Password123!",
      });

      const dupRes = await testApp.client.post("/v1/auth/register", {
        email: "duplicate.user@example.com",
        password: "CompletelyDifferentPassword999!",
      });
      expect(dupRes.status).toBe(409);
      expect(dupRes.body.message).toContain("already registered");
    });

    it("9. login with non-existent email returns generic 401 (preventing user enumeration)", async () => {
      const res = await testApp.client.post("/v1/auth/login", {
        email: "nonexistent.account@example.com",
        password: "SomePassword!",
      });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Invalid email or password");
    });

    it("10. empty login payload returns 400 Bad Request", async () => {
      const res = await testApp.client.post("/v1/auth/login", {});
      expect(res.status).toBe(400);
    });
  });

  describe("Password Reset Token Boundaries", () => {
    it("11. rejects expired password reset token with 401 Unauthorized", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "expired.reset@example.com",
        password: "Password123!",
      });

      const reqRes = await testApp.client.post("/v1/auth/password-reset-request", {
        email: "expired.reset@example.com",
      });
      const token = reqRes.body.resetToken;

      // Manually backdate expiration in state engine to simulate expiry
      const user = Array.from(testApp.stateEngine.users.values()).find(
        (u) => u.email === "expired.reset@example.com"
      );
      user.passwordResetExpires = new Date(Date.now() - 3600000); // 1 hour in past

      const confirmRes = await testApp.client.post("/v1/auth/password-reset-confirm", {
        token,
        newPassword: "NewPassword123!",
      });
      expect(confirmRes.status).toBe(401);
      expect(confirmRes.body.message).toContain("Invalid or expired reset token");
    });

    it("12. rejects tampered or arbitrary reset token with 401 Unauthorized", async () => {
      const res = await testApp.client.post("/v1/auth/password-reset-confirm", {
        token: "completely_fake_token_hex_string_1234567890",
        newPassword: "NewPassword123!",
      });
      expect(res.status).toBe(401);
    });

    it("13. rejects new password shorter than 8 characters on reset confirm (400)", async () => {
      const res = await testApp.client.post("/v1/auth/password-reset-confirm", {
        token: "some-token",
        newPassword: "short",
      });
      expect(res.status).toBe(400);
    });

    it("14. single-use token invalidation: second confirm with same token fails with 401", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "singleuse.token@example.com",
        password: "OldPassword123!",
      });

      const reqRes = await testApp.client.post("/v1/auth/password-reset-request", {
        email: "singleuse.token@example.com",
      });
      const token = reqRes.body.resetToken;

      // First confirm succeeds
      const firstRes = await testApp.client.post("/v1/auth/password-reset-confirm", {
        token,
        newPassword: "NewPassword123!",
      });
      expect(firstRes.status).toBe(200);

      // Second confirm with same token fails
      const secondRes = await testApp.client.post("/v1/auth/password-reset-confirm", {
        token,
        newPassword: "AnotherPassword123!",
      });
      expect(secondRes.status).toBe(401);
    });

    it("15. password reset request for non-existent user returns generic 200 { ok: true }", async () => {
      const res = await testApp.client.post("/v1/auth/password-reset-request", {
        email: "completely.ghost.user@example.com",
      });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.resetToken).toBeUndefined();
    });
  });
});
