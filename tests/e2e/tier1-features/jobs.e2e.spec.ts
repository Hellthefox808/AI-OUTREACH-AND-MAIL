/**
 * Tier 1: Job Postings Multi-Tenant Management E2E Tests.
 *
 * Covers:
 * - F12: JobPosting Schema Multi-Tenancy (>=5 tests)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createE2ETestApp, TestAppInstance } from "../harness/app-test-factory";

describe("Tier 1: Job Postings Multi-Tenant Management E2E Suite", () => {
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

  it("1. creates a job posting within authenticated workspace (201 Created)", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "job.poster@example.com",
      password: "Password123!",
    });

    const res = await testApp.client.post("/v1/jobs", {
      title: "Senior Distributed Systems Engineer",
      type: "full_time",
      workMode: "remote",
      location: "San Francisco, CA",
      applicationUrl: "https://careers.stripe.com/jobs/123",
      requiredSkills: ["TypeScript", "NestJS", "Distributed Systems"],
      salaryMin: 180000,
      salaryMax: 240000,
      salaryCurrency: "USD",
    });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.title).toBe("Senior Distributed Systems Engineer");
    expect(res.body.type).toBe("full_time");
    expect(res.body.workMode).toBe("remote");
  });

  it("2. retrieves job posting details by ID for record within workspace", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "job.reader@example.com",
      password: "Password123!",
    });

    const createRes = await testApp.client.post("/v1/jobs", {
      title: "Staff SRE",
      type: "full_time",
      workMode: "hybrid",
      applicationUrl: "https://careers.example.com/jobs/sre",
    });
    const jobId = createRes.body._id.toString();

    const getRes = await testApp.client.get(`/v1/jobs/${jobId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.title).toBe("Staff SRE");
    expect(getRes.body.workMode).toBe("hybrid");
  });

  it("3. validates canonical workMode enum values strictly", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "job.workmode@example.com",
      password: "Password123!",
    });

    const invalidRes = await testApp.client.post("/v1/jobs", {
      title: "Invalid Work Mode",
      type: "full_time",
      workMode: "anywhere_on_mars", // invalid enum
      applicationUrl: "https://careers.example.com/jobs/invalid",
    });

    expect(invalidRes.status).toBe(400);
  });

  it("4. validates canonical job type enum values strictly", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "job.type@example.com",
      password: "Password123!",
    });

    const invalidRes = await testApp.client.post("/v1/jobs", {
      title: "Invalid Type Job",
      type: "not_a_valid_type",
      workMode: "remote",
      applicationUrl: "https://careers.example.com/jobs/invalid2",
    });

    expect(invalidRes.status).toBe(400);
  });

  it("5. updates job posting fields via PATCH /v1/jobs/:id", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "job.updater@example.com",
      password: "Password123!",
    });

    const createRes = await testApp.client.post("/v1/jobs", {
      title: "Junior Engineer",
      type: "contract",
      workMode: "on_site",
      applicationUrl: "https://careers.example.com/jobs/jr",
    });
    const jobId = createRes.body._id.toString();

    const patchRes = await testApp.client.patch(`/v1/jobs/${jobId}`, {
      title: "Mid-Level Engineer",
      salaryMin: 120000,
    });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.title).toBe("Mid-Level Engineer");
    expect(patchRes.body.salaryMin).toBe(120000);
  });

  it("6. soft deletes job posting and removes it from active list", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "job.delete@example.com",
      password: "Password123!",
    });

    const createRes = await testApp.client.post("/v1/jobs", {
      title: "Temporary Listing",
      type: "temporary",
      workMode: "remote",
      applicationUrl: "https://careers.example.com/jobs/temp",
    });
    const jobId = createRes.body._id.toString();

    const deleteRes = await testApp.client.delete(`/v1/jobs/${jobId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.deleted).toBe(true);

    const getRes = await testApp.client.get(`/v1/jobs/${jobId}`);
    expect(getRes.status).toBe(404);
  });

  it("7. enforces tenant isolation: cross-tenant job posting query returns 404", async () => {
    // Tenant A
    await testApp.client.post("/v1/auth/register", {
      email: "tenantA.job@example.com",
      password: "Password123!",
    });
    const createRes = await testApp.client.post("/v1/jobs", {
      title: "Tenant A Confidential Role",
      type: "full_time",
      workMode: "remote",
      applicationUrl: "https://careers.example.com/jobs/confidential",
    });
    const jobAId = createRes.body._id.toString();

    // Tenant B
    testApp.client.clearAuth();
    await testApp.client.post("/v1/auth/register", {
      email: "tenantB.job@example.com",
      password: "Password123!",
    });

    const crossRes = await testApp.client.get(`/v1/jobs/${jobAId}`);
    expect(crossRes.status).toBe(404);
  });
});
