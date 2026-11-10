/**
 * Tier 2: Multi-Tenancy Isolation & Workspace Boundary E2E Tests.
 *
 * Covers:
 * - Cross-workspace object access prevention across companies, recruiters, jobs
 * - WorkspaceScopeGuard default-deny on un-joined workspaces
 * - Multi-tenant compound uniqueness (domain and email isolation per tenant)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createE2ETestApp, TestAppInstance } from "../harness/app-test-factory";

describe("Tier 2: Multi-Tenancy Isolation & Workspace Boundary E2E Suite", () => {
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

  describe("Cross-Tenant Access Prevention", () => {
    it("1. WorkspaceScopeGuard denies access when target workspace is not in user's workspaceIds (403)", async () => {
      // User A
      await testApp.client.post("/v1/auth/register", {
        email: "tenantA.guard@example.com",
        password: "Password123!",
      });

      // User B
      testApp.client.clearAuth();
      const userB = await testApp.client.post("/v1/auth/register", {
        email: "tenantB.guard@example.com",
        password: "Password123!",
      });
      const wsBId = userB.body.user.workspaceId;

      // User A logs back in
      testApp.client.clearAuth();
      await testApp.client.post("/v1/auth/login", {
        email: "tenantA.guard@example.com",
        password: "Password123!",
      });

      // User A attempts to target User B's workspace via header
      testApp.client.setWorkspaceId(wsBId);
      const res = await testApp.client.get(`/v1/workspaces/${wsBId}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Access denied to this workspace");
    });

    it("2. accessing arbitrary non-existent workspace ID returns 403 Forbidden", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "nonexistent.ws.tester@example.com",
        password: "Password123!",
      });

      const fakeWsId = "000000000000000000000999";
      testApp.client.setWorkspaceId(fakeWsId);
      const res = await testApp.client.get(`/v1/workspaces/${fakeWsId}`);
      expect(res.status).toBe(403);
    });

    it("3. cross-tenant company retrieval returns 404 Not Found", async () => {
      // Tenant 1 creates company
      await testApp.client.post("/v1/auth/register", {
        email: "t1.company.owner@example.com",
        password: "Password123!",
      });
      const cRes = await testApp.client.post("/v1/companies", {
        legalName: "Tenant 1 Exclusive",
        displayName: "Exclusive 1",
        domain: "exclusive1.com",
      });
      const companyId = cRes.body._id.toString();

      // Tenant 2 attempts read
      testApp.client.clearAuth();
      await testApp.client.post("/v1/auth/register", {
        email: "t2.company.attacker@example.com",
        password: "Password123!",
      });

      const getRes = await testApp.client.get(`/v1/companies/${companyId}`);
      expect(getRes.status).toBe(404);
    });

    it("4. cross-tenant company update returns 404 Not Found without modifying target", async () => {
      // Tenant 1
      await testApp.client.post("/v1/auth/register", {
        email: "t1.update.owner@example.com",
        password: "Password123!",
      });
      const cRes = await testApp.client.post("/v1/companies", {
        legalName: "Target Company",
        displayName: "Original Name",
        domain: "targetcompany.com",
      });
      const companyId = cRes.body._id.toString();

      // Tenant 2
      testApp.client.clearAuth();
      await testApp.client.post("/v1/auth/register", {
        email: "t2.update.attacker@example.com",
        password: "Password123!",
      });

      const patchRes = await testApp.client.patch(`/v1/companies/${companyId}`, {
        displayName: "Hacked Display Name",
      });
      expect(patchRes.status).toBe(404);

      // Verify original is untouched
      const original = testApp.stateEngine.companies.get(companyId);
      expect(original.displayName).toBe("Original Name");
    });

    it("5. cross-tenant company deletion returns 404 Not Found without deleting target", async () => {
      // Tenant 1
      await testApp.client.post("/v1/auth/register", {
        email: "t1.delete.owner@example.com",
        password: "Password123!",
      });
      const cRes = await testApp.client.post("/v1/companies", {
        legalName: "Protected Company",
        displayName: "Protected",
        domain: "protected.com",
      });
      const companyId = cRes.body._id.toString();

      // Tenant 2
      testApp.client.clearAuth();
      await testApp.client.post("/v1/auth/register", {
        email: "t2.delete.attacker@example.com",
        password: "Password123!",
      });

      const delRes = await testApp.client.delete(`/v1/companies/${companyId}`);
      expect(delRes.status).toBe(404);

      const target = testApp.stateEngine.companies.get(companyId);
      expect(target.deletedAt).toBeNull();
    });

    it("6. cross-tenant recruiter retrieval returns 404 Not Found", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "t1.rec.owner@example.com",
        password: "Password123!",
      });
      const rRes = await testApp.client.post("/v1/recruiters", {
        name: "Private Recruiter",
        email: "private@recruiter.com",
      });
      const recId = rRes.body._id.toString();

      testApp.client.clearAuth();
      await testApp.client.post("/v1/auth/register", {
        email: "t2.rec.attacker@example.com",
        password: "Password123!",
      });

      const getRes = await testApp.client.get(`/v1/recruiters/${recId}`);
      expect(getRes.status).toBe(404);
    });

    it("7. cross-tenant recruiter update returns 404 Not Found", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "t1.rec.mod.owner@example.com",
        password: "Password123!",
      });
      const rRes = await testApp.client.post("/v1/recruiters", {
        name: "VIP Contact",
      });
      const recId = rRes.body._id.toString();

      testApp.client.clearAuth();
      await testApp.client.post("/v1/auth/register", {
        email: "t2.rec.mod.attacker@example.com",
        password: "Password123!",
      });

      const patchRes = await testApp.client.patch(`/v1/recruiters/${recId}`, {
        name: "Tampered Contact",
      });
      expect(patchRes.status).toBe(404);
    });

    it("8. cross-tenant recruiter deletion returns 404 Not Found", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "t1.rec.del.owner@example.com",
        password: "Password123!",
      });
      const rRes = await testApp.client.post("/v1/recruiters", {
        name: "Protected Contact",
      });
      const recId = rRes.body._id.toString();

      testApp.client.clearAuth();
      await testApp.client.post("/v1/auth/register", {
        email: "t2.rec.del.attacker@example.com",
        password: "Password123!",
      });

      const delRes = await testApp.client.delete(`/v1/recruiters/${recId}`);
      expect(delRes.status).toBe(404);
    });

    it("9. cross-tenant job posting retrieval returns 404 Not Found", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "t1.job.owner@example.com",
        password: "Password123!",
      });
      const jRes = await testApp.client.post("/v1/jobs", {
        title: "Confidential VP",
        type: "full_time",
        workMode: "remote",
        applicationUrl: "https://careers.private.com/vp",
      });
      const jobId = jRes.body._id.toString();

      testApp.client.clearAuth();
      await testApp.client.post("/v1/auth/register", {
        email: "t2.job.attacker@example.com",
        password: "Password123!",
      });

      const getRes = await testApp.client.get(`/v1/jobs/${jobId}`);
      expect(getRes.status).toBe(404);
    });

    it("10. cross-tenant job posting deletion returns 404 Not Found", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "t1.job.del.owner@example.com",
        password: "Password123!",
      });
      const jRes = await testApp.client.post("/v1/jobs", {
        title: "Protected Role",
        type: "contract",
        workMode: "on_site",
        applicationUrl: "https://careers.private.com/prot",
      });
      const jobId = jRes.body._id.toString();

      testApp.client.clearAuth();
      await testApp.client.post("/v1/auth/register", {
        email: "t2.job.del.attacker@example.com",
        password: "Password123!",
      });

      const delRes = await testApp.client.delete(`/v1/jobs/${jobId}`);
      expect(delRes.status).toBe(404);
    });

    it("11. two distinct workspaces can register the same company domain (multi-tenant compound uniqueness)", async () => {
      // Workspace 1 creates Stripe
      await testApp.client.post("/v1/auth/register", {
        email: "ws1.user@example.com",
        password: "Password123!",
      });
      const res1 = await testApp.client.post("/v1/companies", {
        legalName: "Stripe US",
        displayName: "Stripe",
        domain: "stripe.com",
      });
      expect(res1.status).toBe(201);

      // Workspace 2 also creates Stripe
      testApp.client.clearAuth();
      await testApp.client.post("/v1/auth/register", {
        email: "ws2.user@example.com",
        password: "Password123!",
      });
      const res2 = await testApp.client.post("/v1/companies", {
        legalName: "Stripe EU",
        displayName: "Stripe",
        domain: "stripe.com",
      });
      expect(res2.status).toBe(201);

      expect(res1.body._id).not.toBe(res2.body._id);
    });

    it("12. two distinct workspaces can register the same recruiter contact email", async () => {
      // Workspace 1 creates recruiter
      await testApp.client.post("/v1/auth/register", {
        email: "ws1.rec.user@example.com",
        password: "Password123!",
      });
      const res1 = await testApp.client.post("/v1/recruiters", {
        name: "Common Recruiter",
        email: "common@agency.com",
      });
      expect(res1.status).toBe(201);

      // Workspace 2 creates recruiter with same email
      testApp.client.clearAuth();
      await testApp.client.post("/v1/auth/register", {
        email: "ws2.rec.user@example.com",
        password: "Password123!",
      });
      const res2 = await testApp.client.post("/v1/recruiters", {
        name: "Common Recruiter",
        email: "common@agency.com",
      });
      expect(res2.status).toBe(201);
      expect(res1.body._id).not.toBe(res2.body._id);
    });
  });
});
