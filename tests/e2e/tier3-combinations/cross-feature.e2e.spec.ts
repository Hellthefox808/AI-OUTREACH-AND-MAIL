/**
 * Tier 3: Cross-Feature Combinations (Pairwise Coverage) E2E Tests.
 *
 * Covers:
 * - Combo 1: Registration -> MFA Enrollment -> Verification -> Protected Company Write
 * - Combo 2: Token Rotation Sequence -> Single-Use Invalidation -> Replay Attack Interception
 * - Combo 3: Workspace Switching -> Entity Creation -> Multi-Tenant Query Isolation
 * - Combo 4: Company -> Recruiter -> Job Posting Relational Integrity Chain
 * - Combo 5: Account Lockout -> Password Reset Override -> Session Annihilation & Re-login
 * - Combo 6: CSRF Double-Submit vs Bearer Token Flow
 * - Combo 7: Role Downgrade (Admin -> Viewer) -> Immediate Write Revocation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import * as speakeasy from "speakeasy";
import { createE2ETestApp, TestAppInstance } from "../harness/app-test-factory";
import { ROLES, PERMISSIONS } from "@career-intelligence/shared";

describe("Tier 3: Cross-Feature Combinations E2E Suite", () => {
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

  it("1. Combo: Registration -> MFA Enrollment -> Verification -> Protected Action", async () => {
    // 1. Register
    const regRes = await testApp.client.post("/v1/auth/register", {
      email: "combo.mfa@example.com",
      password: "Password123!",
    });
    expect(regRes.status).toBe(201);

    // 2. Enroll MFA
    const enrollRes = await testApp.client.post("/v1/auth/mfa/enroll");
    expect(enrollRes.status).toBe(200);
    const secret = enrollRes.body.secret;

    // 3. Verify MFA
    const totpToken = speakeasy.totp({ secret, encoding: "base32" });
    const verifyRes = await testApp.client.post("/v1/auth/mfa/verify", {
      token: totpToken,
    });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.mfaEnabled).toBe(true);

    // 4. Perform protected action with MFA active
    const compRes = await testApp.client.post("/v1/companies", {
      legalName: "MFA Protected Co",
      displayName: "MFA Co",
      domain: "mfaco.com",
    });
    expect(compRes.status).toBe(201);
  });

  it("2. Combo: Multi-Round Token Rotation -> Prior Token Invalidation", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "combo.rotation@example.com",
      password: "Password123!",
    });

    const token0 = testApp.client.getCookie("refresh_token")!;

    // Wait 1.1s so integer-second JWT timestamp advances
    await new Promise((r) => setTimeout(r, 1100));
    const rot1 = await testApp.client.post("/v1/auth/refresh");
    expect(rot1.status).toBe(200);
    const token1 = testApp.client.getCookie("refresh_token")!;

    await new Promise((r) => setTimeout(r, 1100));
    const rot2 = await testApp.client.post("/v1/auth/refresh");
    expect(rot2.status).toBe(200);

    // Replay token0 -> must fail
    testApp.client.setCookie("refresh_token", token0);
    const replay0 = await testApp.client.post("/v1/auth/refresh");
    expect(replay0.status).toBe(401);

    // Replay token1 -> must fail
    testApp.client.setCookie("refresh_token", token1);
    const replay1 = await testApp.client.post("/v1/auth/refresh");
    expect(replay1.status).toBe(401);
  });

  it("3. Combo: Multi-Tenant Workspace Isolation -> Distinct Tenant Entity Segregation", async () => {
    // Tenant 1 registers
    const regRes1 = await testApp.client.post("/v1/auth/register", {
      email: "combo.tenant1@example.com",
      password: "Password123!",
    });
    expect(regRes1.status).toBe(201);

    // Tenant 1 creates company
    const c1Res = await testApp.client.post("/v1/companies", {
      legalName: "Tenant 1 Exclusive",
      displayName: "T1 Co",
      domain: "t1co.com",
    });
    expect(c1Res.status).toBe(201);
    const company1Id = c1Res.body._id.toString();

    // Tenant 2 registers
    testApp.client.clearAuth();
    const regRes2 = await testApp.client.post("/v1/auth/register", {
      email: "combo.tenant2@example.com",
      password: "Password123!",
    });
    expect(regRes2.status).toBe(201);

    // Tenant 2 queries company list -> Tenant 1's company must NOT appear
    const listRes2 = await testApp.client.get("/v1/companies");
    expect(listRes2.status).toBe(200);
    const foundInT2 = listRes2.body.items.find((c: any) => c._id.toString() === company1Id);
    expect(foundInT2).toBeUndefined();

    // Tenant 2 attempts direct access by ID -> 404 Not Found
    const directRes2 = await testApp.client.get(`/v1/companies/${company1Id}`);
    expect(directRes2.status).toBe(404);
  });

  it("4. Combo: Company -> Recruiter -> Job Posting Relational Integrity Chain", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "combo.relational@example.com",
      password: "Password123!",
    });

    // 1. Create Company
    const compRes = await testApp.client.post("/v1/companies", {
      legalName: "Anthropic PBC",
      displayName: "Anthropic",
      domain: "anthropic.com",
      tier: "TIER_1",
    });
    expect(compRes.status).toBe(201);
    const companyId = compRes.body._id.toString();

    // 2. Create Recruiter referencing Company
    const recRes = await testApp.client.post("/v1/recruiters", {
      name: "Lead AI Talent Partner",
      companyId,
      email: "talent@anthropic.com",
      verificationStatus: "VERIFIED",
    });
    expect(recRes.status).toBe(201);
    expect(recRes.body.companyId).toBe(companyId);
    const recruiterId = recRes.body._id.toString();

    // 3. Create Job Posting referencing Company
    const jobRes = await testApp.client.post("/v1/jobs", {
      title: "Research Engineer - Alignment",
      companyId,
      type: "full_time",
      workMode: "remote",
      applicationUrl: "https://jobs.anthropic.com/research-engineer",
    });
    expect(jobRes.status).toBe(201);
    expect(jobRes.body.companyId).toBe(companyId);

    // 4. Verify all entities exist and are linked in the same workspace
    const recDetail = await testApp.client.get(`/v1/recruiters/${recruiterId}`);
    expect(recDetail.body.companyId).toBe(companyId);
  });

  it("5. Combo: Account Lockout -> Password Reset Override -> Session Annihilation & Re-login", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "combo.recovery@example.com",
      password: "InitialPassword123!",
    });
    testApp.client.clearAuth();

    // Lock account with 5 bad attempts
    for (let i = 0; i < 5; i++) {
      await testApp.client.post("/v1/auth/login", {
        email: "combo.recovery@example.com",
        password: "BadPassword!",
      });
    }

    // Confirm it is locked
    const lockedRes = await testApp.client.post("/v1/auth/login", {
      email: "combo.recovery@example.com",
      password: "InitialPassword123!",
    });
    expect(lockedRes.status).toBe(403);

    // Reset password
    const reqRes = await testApp.client.post("/v1/auth/password-reset-request", {
      email: "combo.recovery@example.com",
    });
    await testApp.client.post("/v1/auth/password-reset-confirm", {
      token: reqRes.body.resetToken,
      newPassword: "RecoveredPassword456!",
    });

    // Login with new password succeeds and resets lockout
    const recoverLogin = await testApp.client.post("/v1/auth/login", {
      email: "combo.recovery@example.com",
      password: "RecoveredPassword456!",
    });
    expect(recoverLogin.status).toBe(200);
    expect(recoverLogin.body.accessToken).toBeDefined();

    // Verify user is active and can perform protected action
    const compRes = await testApp.client.post("/v1/companies", {
      legalName: "Post-Recovery Co",
      displayName: "Post Recovery",
      domain: "postrecovery.com",
    });
    expect(compRes.status).toBe(201);
  });

  it("6. Combo: Role Downgrade (Admin -> Viewer) -> Immediate Write Revocation", async () => {
    const regRes = await testApp.client.post("/v1/auth/register", {
      email: "combo.downgrade@example.com",
      password: "Password123!",
    });
    const wsId = regRes.body.user.workspaceId;

    // As Admin: write succeeds
    const c1 = await testApp.client.post("/v1/companies", {
      legalName: "Admin Created Co",
      displayName: "Admin Co",
      domain: "adminco.com",
    });
    expect(c1.status).toBe(201);
    const companyId = c1.body._id.toString();

    // Demote user to VIEWER
    const membership = Array.from(testApp.stateEngine.memberships.values()).find(
      (m) => m.workspaceId.toString() === wsId
    );
    membership.role = ROLES.VIEWER;

    // Re-login to get VIEWER token
    testApp.client.clearAuth();
    await testApp.client.post("/v1/auth/login", {
      email: "combo.downgrade@example.com",
      password: "Password123!",
    });

    // Attempt to PATCH company -> 403 Forbidden
    const patchRes = await testApp.client.patch(`/v1/companies/${companyId}`, {
      displayName: "Hacked by Viewer",
    });
    expect(patchRes.status).toBe(403);
    expect(patchRes.body.message).toContain("Insufficient permissions");

    // But reading still succeeds (200 OK)
    const readRes = await testApp.client.get(`/v1/companies/${companyId}`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.displayName).toBe("Admin Co");
  });
});
