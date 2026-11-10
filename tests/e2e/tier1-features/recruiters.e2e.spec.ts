/**
 * Tier 1: Recruiters Multi-Tenant Contact Management E2E Tests.
 *
 * Covers:
 * - F11: Recruiter Schema Multi-Tenancy (>=5 tests)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createE2ETestApp, TestAppInstance } from "../harness/app-test-factory";

describe("Tier 1: Recruiters Multi-Tenant Contact Management E2E Suite", () => {
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

  it("1. creates a recruiter record within authenticated workspace (201 Created)", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "recruiter.tester@example.com",
      password: "Password123!",
    });

    const res = await testApp.client.post("/v1/recruiters", {
      name: "Sarah Talent",
      designation: "Senior Technical Sourcer",
      department: "Engineering Recruiting",
      email: "sarah.talent@stripe.com",
    });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.name).toBe("Sarah Talent");
    expect(res.body.email).toBe("sarah.talent@stripe.com");
  });

  it("2. defaults verificationStatus to UNVERIFIED on creation", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "recruiter.verif@example.com",
      password: "Password123!",
    });

    const res = await testApp.client.post("/v1/recruiters", {
      name: "Alex Unverified",
      email: "alex@unverified.io",
    });

    expect(res.status).toBe(201);
    expect(res.body.verificationStatus).toBe("UNVERIFIED");
  });

  it("3. retrieves recruiter details by ID for record within workspace", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "recruiter.get@example.com",
      password: "Password123!",
    });

    const createRes = await testApp.client.post("/v1/recruiters", {
      name: "Marcus Headhunter",
      designation: "Principal Partner",
    });
    const recruiterId = createRes.body._id.toString();

    const getRes = await testApp.client.get(`/v1/recruiters/${recruiterId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe("Marcus Headhunter");
  });

  it("4. updates recruiter contact fields via PATCH /v1/recruiters/:id", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "recruiter.patch@example.com",
      password: "Password123!",
    });

    const createRes = await testApp.client.post("/v1/recruiters", {
      name: "Elena Recruiter",
      designation: "Staff Recruiter",
    });
    const recruiterId = createRes.body._id.toString();

    const patchRes = await testApp.client.patch(`/v1/recruiters/${recruiterId}`, {
      designation: "Director of Talent",
      verificationStatus: "VERIFIED",
    });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.designation).toBe("Director of Talent");
    expect(patchRes.body.verificationStatus).toBe("VERIFIED");
  });

  it("5. soft deletes recruiter and removes contact from active listings", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "recruiter.delete@example.com",
      password: "Password123!",
    });

    const createRes = await testApp.client.post("/v1/recruiters", {
      name: "Temporary Contact",
      email: "temp@example.com",
    });
    const recruiterId = createRes.body._id.toString();

    const deleteRes = await testApp.client.delete(`/v1/recruiters/${recruiterId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.deleted).toBe(true);

    const getRes = await testApp.client.get(`/v1/recruiters/${recruiterId}`);
    expect(getRes.status).toBe(404);
  });

  it("6. enforces tenant isolation: cross-tenant recruiter query returns 404", async () => {
    // Tenant A
    await testApp.client.post("/v1/auth/register", {
      email: "tenantA.recruiter@example.com",
      password: "Password123!",
    });
    const createRes = await testApp.client.post("/v1/recruiters", {
      name: "Tenant A VIP Recruiter",
    });
    const recruiterAId = createRes.body._id.toString();

    // Tenant B
    testApp.client.clearAuth();
    await testApp.client.post("/v1/auth/register", {
      email: "tenantB.recruiter@example.com",
      password: "Password123!",
    });

    const crossRes = await testApp.client.get(`/v1/recruiters/${recruiterAId}`);
    expect(crossRes.status).toBe(404);
  });
});
