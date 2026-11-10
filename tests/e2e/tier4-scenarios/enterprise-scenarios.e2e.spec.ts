/**
 * Tier 4: Real-World Enterprise Application Scenarios E2E Tests.
 *
 * Reproduces complete enterprise day-in-the-life operational narratives:
 * - Scenario 1: Enterprise Recruiter Discovery & Outreach Pipeline
 * - Scenario 2: Multi-Organization Tenant Onboarding & Admin Delegation
 * - Scenario 3: Compromised Credential Incident Response & Threat Mitigation
 * - Scenario 4: High-Scale Data Pagination & Deep Cursor Traversal
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createE2ETestApp, TestAppInstance } from "../harness/app-test-factory";
import { ROLES, PERMISSIONS } from "@career-intelligence/shared";

describe("Tier 4: Enterprise Real-World Application Scenarios E2E Suite", () => {
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

  it("Scenario 1: Enterprise Recruiter Discovery & Outreach Lifecycle", async () => {
    // 1. Enterprise Talent Lead registers
    const regRes = await testApp.client.post("/v1/auth/register", {
      email: "recruiter.lead@enterprise-talent.com",
      password: "EnterpriseLeadPassword123!",
    });
    expect(regRes.status).toBe(201);
    expect(regRes.body.user).toBeDefined();
    const membership = Array.from(testApp.stateEngine.memberships.values()).find(
      (m) => m.userId.toString() === regRes.body.user.id
    );
    expect(membership?.role).toBe(ROLES.ADMIN);
    const workspaceId = regRes.body.user.workspaceId;
    expect(workspaceId).toBeDefined();

    // 2. Discover and create target enterprise company (Stripe, Inc.)
    const companyRes = await testApp.client.post("/v1/companies", {
      legalName: "Stripe, Inc.",
      displayName: "Stripe",
      domain: "stripe.com",
      tier: "TIER_1",
      industry: "Financial Technology",
      notes: "High priority fintech target for staff engineering talent",
    });
    expect(companyRes.status).toBe(201);
    expect(companyRes.body._id).toBeDefined();
    expect(companyRes.body.displayName).toBe("Stripe");
    const companyId = companyRes.body._id.toString();

    // 3. Attach recruiter contact under Stripe
    const recruiterRes = await testApp.client.post("/v1/recruiters", {
      name: "Jane Doe",
      email: "jane.doe@stripe.com",
      companyId,
      linkedinUrl: "https://www.linkedin.com/in/janedoe-talent",
      role: "Head of Infrastructure Recruiting",
      verificationStatus: "UNVERIFIED",
    });
    expect(recruiterRes.status).toBe(201);
    expect(recruiterRes.body._id).toBeDefined();
    expect(recruiterRes.body.companyId).toBe(companyId);
    expect(recruiterRes.body.verificationStatus).toBe("UNVERIFIED");
    const recruiterId = recruiterRes.body._id.toString();

    // 4. Outreach verification: update recruiter to VERIFIED with verified notes
    const updateRecRes = await testApp.client.patch(`/v1/recruiters/${recruiterId}`, {
      verificationStatus: "VERIFIED",
      notes: "Direct contact established; confirmed technical hiring sponsor",
    });
    expect(updateRecRes.status).toBe(200);
    expect(updateRecRes.body.verificationStatus).toBe("VERIFIED");
    expect(updateRecRes.body.notes).toContain("Direct contact established");

    // 5. Open requisition link: create job posting linked to company
    const jobRes = await testApp.client.post("/v1/jobs", {
      title: "Staff Infrastructure Engineer - Global Payments",
      companyId,
      type: "full_time",
      workMode: "remote",
      salaryMin: 220000,
      salaryMax: 290000,
      applicationUrl: "https://stripe.com/jobs/staff-infra-payments",
      notes: "Core ledger infrastructure and low-latency settlement systems",
    });
    expect(jobRes.status).toBe(201);
    expect(jobRes.body._id).toBeDefined();
    expect(jobRes.body.companyId).toBe(companyId);
    expect(jobRes.body.salaryMin).toBe(220000);
    const jobId = jobRes.body._id.toString();

    // 6. Comprehensive pipeline audit: fetch and verify all entities
    const getCompany = await testApp.client.get(`/v1/companies/${companyId}`);
    expect(getCompany.status).toBe(200);
    expect(getCompany.body.legalName).toBe("Stripe, Inc.");

    const getRecruiter = await testApp.client.get(`/v1/recruiters/${recruiterId}`);
    expect(getRecruiter.status).toBe(200);
    expect(getRecruiter.body.companyId).toBe(companyId);
    expect(getRecruiter.body.verificationStatus).toBe("VERIFIED");

    const getJob = await testApp.client.get(`/v1/jobs/${jobId}`);
    expect(getJob.status).toBe(200);
    expect(getJob.body.companyId).toBe(companyId);
    expect(getJob.body.workMode).toBe("remote");

    // 7. Verify collection queries contain the new entities
    const listCompanies = await testApp.client.get("/v1/companies");
    expect(listCompanies.body.items.some((c: any) => c._id.toString() === companyId)).toBe(true);

    const listRecruiters = await testApp.client.get("/v1/recruiters");
    expect(listRecruiters.body.items.some((r: any) => r._id.toString() === recruiterId)).toBe(true);

    const listJobs = await testApp.client.get("/v1/jobs");
    expect(listJobs.body.items.some((j: any) => j._id.toString() === jobId)).toBe(true);

    // 8. Requisition close / soft delete job posting
    const delJobRes = await testApp.client.delete(`/v1/jobs/${jobId}`);
    expect(delJobRes.status).toBe(200);

    const verifyDelJob = await testApp.client.get(`/v1/jobs/${jobId}`);
    expect(verifyDelJob.status).toBe(404);
  });

  it("Scenario 2: Multi-Organization Tenant Onboarding & Admin Delegation", async () => {
    // 1. Primary Organization Admin registers
    const adminReg = await testApp.client.post("/v1/auth/register", {
      email: "corp.admin@megacorp.com",
      password: "CorporateAdminPassword123!",
    });
    expect(adminReg.status).toBe(201);
    const adminWorkspaceId = adminReg.body.user.workspaceId;
    const adminUserId = adminReg.body.user.id;

    // 2. Admin provisions corporate entity in workspace
    const corpCoRes = await testApp.client.post("/v1/companies", {
      legalName: "MegaCorp Global Services LLC",
      displayName: "MegaCorp",
      domain: "megacorp.com",
    });
    expect(corpCoRes.status).toBe(201);
    const companyId = corpCoRes.body._id.toString();

    // 3. Delegate Member registers
    testApp.client.clearAuth();
    const memberReg = await testApp.client.post("/v1/auth/register", {
      email: "team.viewer@megacorp.com",
      password: "TeamViewerPassword123!",
    });
    expect(memberReg.status).toBe(201);
    const memberUserId = memberReg.body.user.id;

    // 4. Admin delegates VIEWER membership in Admin's workspace to Member
    testApp.stateEngine.memberships.set(`mem_${memberUserId}_${adminWorkspaceId}`, {
      _id: `mem_${memberUserId}_${adminWorkspaceId}`,
      userId: memberUserId,
      workspaceId: adminWorkspaceId,
      role: ROLES.VIEWER,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const memberUser = testApp.stateEngine.users.get(memberUserId);
    if (memberUser) {
      memberUser.workspaceIds = [adminWorkspaceId, ...memberUser.workspaceIds];
    }

    // 5. Delegate logs in to acquire token with VIEWER access to Admin workspace
    testApp.client.clearAuth();
    const memberLogin = await testApp.client.post("/v1/auth/login", {
      email: "team.viewer@megacorp.com",
      password: "TeamViewerPassword123!",
    });
    expect(memberLogin.status).toBe(200);

    // Set active workspace header to admin workspace
    testApp.client.setWorkspaceId(adminWorkspaceId);

    // 6. RBAC Verification: VIEWER can read corporate data
    const memberReadRes = await testApp.client.get(`/v1/companies/${companyId}`);
    expect(memberReadRes.status).toBe(200);
    expect(memberReadRes.body.displayName).toBe("MegaCorp");

    // 7. RBAC Verification: VIEWER cannot mutate or create corporate entities
    const memberCreateRes = await testApp.client.post("/v1/companies", {
      legalName: "Unauthorized Subsidiary Inc",
      displayName: "Unauthorized",
      domain: "unauth.com",
    });
    expect(memberCreateRes.status).toBe(403);
    expect(memberCreateRes.body.message).toContain("Insufficient permissions");

    const memberPatchRes = await testApp.client.patch(`/v1/companies/${companyId}`, {
      displayName: "Hacked MegaCorp",
    });
    expect(memberPatchRes.status).toBe(403);
    expect(memberPatchRes.body.message).toContain("Insufficient permissions");

    const memberDelRes = await testApp.client.delete(`/v1/companies/${companyId}`);
    expect(memberDelRes.status).toBe(403);
    expect(memberDelRes.body.message).toContain("Insufficient permissions");

    // 8. Admin revokes Member's access (de-provisioning)
    testApp.stateEngine.memberships.delete(`mem_${memberUserId}_${adminWorkspaceId}`);
    if (memberUser) {
      memberUser.workspaceIds = memberUser.workspaceIds.filter((id: string) => id !== adminWorkspaceId);
    }

    // Re-login member with de-provisioned workspace
    testApp.client.clearAuth();
    await testApp.client.post("/v1/auth/login", {
      email: "team.viewer@megacorp.com",
      password: "TeamViewerPassword123!",
    });

    // Attempting access to admin workspace company now fails (company not found in member workspace -> 404)
    const deprovRes = await testApp.client.get(`/v1/companies/${companyId}`);
    expect(deprovRes.status).toBe(404);

    // And attempting to access admin workspace directly via workspaces API is denied (403 Forbidden)
    const wsDeniedRes = await testApp.client.get(`/v1/workspaces/${adminWorkspaceId}`);
    expect(wsDeniedRes.status).toBe(403);
    expect(wsDeniedRes.body.message).toContain("Access denied");
  });

  it("Scenario 3: Compromised Credential Incident Response & Threat Mitigation", async () => {
    // 1. Provision target high-privilege executive account
    const regRes = await testApp.client.post("/v1/auth/register", {
      email: "ciso@defense-agency.gov",
      password: "InitialPassword2026!",
    });
    expect(regRes.status).toBe(201);
    testApp.client.clearAuth();

    // 2. Threat Actor launches credential-stuffing attack: 5 consecutive failed attempts
    for (let i = 1; i <= 5; i++) {
      const failRes = await testApp.client.post("/v1/auth/login", {
        email: "ciso@defense-agency.gov",
        password: `AttackerGuess${i}!`,
      });
      expect(failRes.status).toBe(401);
      expect(failRes.body.message).toContain("Invalid email or password");
    }

    // 3. Verify account is now locked: subsequent login attempts rejected with 403 Forbidden
    const legitDuringLock = await testApp.client.post("/v1/auth/login", {
      email: "ciso@defense-agency.gov",
      password: "InitialPassword2026!",
    });
    expect(legitDuringLock.status).toBe(403);
    expect(legitDuringLock.body.message).toContain("Account is temporarily locked");

    // 5. Incident Response: Out-of-band Password Reset Protocol
    const resetReq = await testApp.client.post("/v1/auth/password-reset-request", {
      email: "ciso@defense-agency.gov",
    });
    expect(resetReq.status).toBe(200);
    const resetToken = resetReq.body.resetToken;
    expect(resetToken).toBeDefined();

    // 6. Confirm reset with hardened passphrase
    const resetConfirm = await testApp.client.post("/v1/auth/password-reset-confirm", {
      token: resetToken,
      newPassword: "HardenedUltraShield2026!#",
    });
    expect(resetConfirm.status).toBe(200);
    expect(resetConfirm.body.ok).toBe(true);

    // 7. Verification: Old password is permanently invalid
    const oldPassRes = await testApp.client.post("/v1/auth/login", {
      email: "ciso@defense-agency.gov",
      password: "InitialPassword2026!",
    });
    expect(oldPassRes.status).toBe(401);

    // 8. Genuine executive logs in with hardened credentials -> Lockout cleared, tokens granted
    const restoredLogin = await testApp.client.post("/v1/auth/login", {
      email: "ciso@defense-agency.gov",
      password: "HardenedUltraShield2026!#",
    });
    expect(restoredLogin.status).toBe(200);
    expect(restoredLogin.body.accessToken).toBeDefined();

    // 9. Verify full access restoration to protected resources
    const auditCoRes = await testApp.client.post("/v1/companies", {
      legalName: "National Defense Cyber Command",
      displayName: "CyberCommand",
      domain: "cybercommand.mil",
    });
    expect(auditCoRes.status).toBe(201);
  });

  it("Scenario 4: High-Scale Data Pagination & Deep Cursor Traversal", async () => {
    // 1. Register high-throughput ingestion account
    const regRes = await testApp.client.post("/v1/auth/register", {
      email: "scale.sync@hypergrowth.com",
      password: "HyperGrowthScalePassword123!",
    });
    expect(regRes.status).toBe(201);
    const workspaceId = regRes.body.user.workspaceId;

    // 2. Ingest 45 sequentially sorted enterprise companies
    const totalRecords = 45;
    const repo = testApp.stateEngine.createCompanyRepo();

    for (let i = 1; i <= totalRecords; i++) {
      const padNum = String(i).padStart(3, "0");
      await repo.create({
        workspaceId,
        legalName: `Scale Ingestion Corp ${padNum}`,
        displayName: `Corp ${padNum}`,
        domain: `scale-corp-${padNum}.io`,
        tier: i % 2 === 0 ? "TIER_1" : "TIER_2",
      });
    }

    // 3. Deep cursor traversal with limit = 10
    const pageSize = 10;
    const seenIds = new Set<string>();
    let cursor: string | null = null;
    let pageCount = 0;
    let previousTimestamp = Infinity;

    do {
      const url = cursor
        ? `/v1/companies?limit=${pageSize}&cursor=${cursor}`
        : `/v1/companies?limit=${pageSize}`;

      const pageRes = await testApp.client.get(url);
      expect(pageRes.status).toBe(200);
      expect(pageRes.body.items).toBeDefined();

      const items = pageRes.body.items;
      expect(items.length).toBeLessThanOrEqual(pageSize);

      for (const item of items) {
        // Mathematical Property 1: Zero duplicate records across pages
        expect(seenIds.has(item._id.toString())).toBe(false);
        seenIds.add(item._id.toString());

        // Mathematical Property 2: Total ordering (descending createdAt)
        const itemTime = new Date(item.createdAt).getTime();
        expect(itemTime).toBeLessThanOrEqual(previousTimestamp);
        previousTimestamp = itemTime;
      }

      cursor = pageRes.body.nextCursor;
      pageCount++;

      if (seenIds.size < totalRecords) {
        expect(pageRes.body.hasMore).toBe(true);
        expect(cursor).toBeTruthy();
      } else {
        expect(pageRes.body.hasMore).toBe(false);
      }
    } while (cursor && pageCount < 10);

    // Mathematical Property 3: 100% data integrity (exact count of items reached)
    expect(seenIds.size).toBe(totalRecords);
    // 45 items with limit=10 -> exactly 5 pages (10, 10, 10, 10, 5)
    expect(pageCount).toBe(5);

    // Mathematical Property 4: Exhausted / out-of-range cursor handling
    const invalidCursorRes = await testApp.client.get("/v1/companies?limit=10&cursor=000000000000000000000000");
    expect(invalidCursorRes.status).toBe(200);
    expect(invalidCursorRes.body.items).toEqual([]);
    expect(invalidCursorRes.body.hasMore).toBe(false);
  });
});
