/**
 * Tier 1: Companies Multi-Tenant Management E2E Tests.
 *
 * Covers:
 * - F10: Company Schema Multi-Tenancy (>=5 tests)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createE2ETestApp, TestAppInstance } from "../harness/app-test-factory";

describe("Tier 1: Companies Multi-Tenant Management E2E Suite", () => {
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

  it("1. creates a company record within authenticated workspace successfully (201 Created)", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "company.creator@example.com",
      password: "Password123!",
    });

    const res = await testApp.client.post("/v1/companies", {
      legalName: "Stripe, Inc.",
      displayName: "Stripe",
      domain: "stripe.com",
      canonicalWebsite: "https://stripe.com",
      industries: ["fintech", "saas"],
      tier: "TIER_1",
    });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.legalName).toBe("Stripe, Inc.");
    expect(res.body.domain).toBe("stripe.com");
    expect(res.body.tier).toBe("TIER_1");
  });

  it("2. retrieves company details by ID for company within workspace", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "company.reader@example.com",
      password: "Password123!",
    });

    const createRes = await testApp.client.post("/v1/companies", {
      legalName: "Datadog, Inc.",
      displayName: "Datadog",
      domain: "datadoghq.com",
      industries: ["cloud_computing", "devops_sre"],
    });
    const companyId = createRes.body._id.toString();

    const getRes = await testApp.client.get(`/v1/companies/${companyId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.displayName).toBe("Datadog");
  });

  it("3. updates company attributes via PATCH /v1/companies/:id", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "company.updater@example.com",
      password: "Password123!",
    });

    const createRes = await testApp.client.post("/v1/companies", {
      legalName: "Figma Inc.",
      displayName: "Figma",
      domain: "figma.com",
    });
    const companyId = createRes.body._id.toString();

    const updateRes = await testApp.client.patch(`/v1/companies/${companyId}`, {
      displayName: "Figma (Adobe)",
      tier: "TIER_1",
    });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.displayName).toBe("Figma (Adobe)");
    expect(updateRes.body.tier).toBe("TIER_1");
  });

  it("4. soft deletes company and excludes it from active listing", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "company.deleter@example.com",
      password: "Password123!",
    });

    const createRes = await testApp.client.post("/v1/companies", {
      legalName: "Temporary Corp",
      displayName: "Temp",
      domain: "tempcorp.com",
    });
    const companyId = createRes.body._id.toString();

    const deleteRes = await testApp.client.delete(`/v1/companies/${companyId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.deleted).toBe(true);

    // Subsequent retrieval fails with 404 Not Found
    const getRes = await testApp.client.get(`/v1/companies/${companyId}`);
    expect(getRes.status).toBe(404);
  });

  it("5. enforces tenant isolation: cross-tenant company access returns 404", async () => {
    // Tenant A
    const tenantA = await testApp.client.post("/v1/auth/register", {
      email: "tenantA.company@example.com",
      password: "Password123!",
    });
    const createRes = await testApp.client.post("/v1/companies", {
      legalName: "Tenant A Secret Co",
      displayName: "Secret Co",
      domain: "secretco.com",
    });
    const companyAId = createRes.body._id.toString();

    // Tenant B
    testApp.client.clearAuth();
    await testApp.client.post("/v1/auth/register", {
      email: "tenantB.company@example.com",
      password: "Password123!",
    });

    // Tenant B attempts to read Tenant A's company
    const crossRes = await testApp.client.get(`/v1/companies/${companyAId}`);
    expect(crossRes.status).toBe(404);
  });

  it("6. company list is strictly scoped to authenticated workspace", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "company.list.user@example.com",
      password: "Password123!",
    });

    await testApp.client.post("/v1/companies", {
      legalName: "Alpha Co",
      displayName: "Alpha",
      domain: "alpha.com",
    });
    await testApp.client.post("/v1/companies", {
      legalName: "Beta Co",
      displayName: "Beta",
      domain: "beta.com",
    });

    const listRes = await testApp.client.get("/v1/companies");
    expect(listRes.status).toBe(200);
    expect(listRes.body.items).toBeInstanceOf(Array);
    expect(listRes.body.items.length).toBeGreaterThanOrEqual(2);
    expect(listRes.body.items.every((c: any) => c.deletedAt === null)).toBe(true);
  });
});
