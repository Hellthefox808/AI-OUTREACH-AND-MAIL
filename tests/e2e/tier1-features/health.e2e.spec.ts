/**
 * Tier 1: Health Probes & Routing E2E Tests.
 *
 * Covers:
 * - F1: Health Probes & Routing (>=5 tests)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createE2ETestApp, TestAppInstance } from "../harness/app-test-factory";

describe("Tier 1: Health Probes & Routing E2E Suite", () => {
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

  it("1. GET /v1/health readiness probe returns 200 with service metadata", async () => {
    const res = await testApp.client.get("/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("career-intelligence-os-be");
    expect(res.body.timestamp).toBeDefined();
  });

  it("2. GET /v1/health/liveness returns 200 with alive status and valid timestamp", async () => {
    const res = await testApp.client.get("/v1/health/liveness");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();
  });

  it("3. health probes bypass authentication (@Public)", async () => {
    testApp.client.clearAuth();
    const res = await testApp.client.get("/v1/health");
    expect(res.status).toBe(200);
  });

  it("4. health probes bypass workspace context requirements (@WorkspaceAgnostic)", async () => {
    testApp.client.removeHeader("x-workspace-id");
    const res = await testApp.client.get("/v1/health/liveness");
    expect(res.status).toBe(200);
  });

  it("5. health probes succeed without CSRF token headers", async () => {
    testApp.client.removeHeader("x-csrf-token");
    const res = await testApp.client.get("/v1/health");
    expect(res.status).toBe(200);
  });

  it("6. timestamp returned in health probe is recent (within 5 seconds)", async () => {
    const beforeTime = Date.now();
    const res = await testApp.client.get("/v1/health/liveness");
    const afterTime = Date.now();

    const reportedTime = new Date(res.body.timestamp).getTime();
    expect(reportedTime).toBeGreaterThanOrEqual(beforeTime - 2000);
    expect(reportedTime).toBeLessThanOrEqual(afterTime + 2000);
  });
});
