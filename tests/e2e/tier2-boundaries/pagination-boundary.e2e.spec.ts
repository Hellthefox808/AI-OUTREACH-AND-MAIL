/**
 * Tier 2: Pagination Bounds & Cursor Traversal E2E Tests.
 *
 * Covers:
 * - F14: BaseRepository Transaction Runner & Pagination Bounds (>=5 tests)
 * - Upper bound clamping (limit <= 100)
 * - Lower bound clamping (limit >= 1)
 * - Sequential cursor-based traversal without item loss or duplication
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createE2ETestApp, TestAppInstance } from "../harness/app-test-factory";

describe("Tier 2: Pagination Bounds & Cursor Traversal E2E Suite", () => {
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

  it("1. negative limit parameter (limit=-5) is clamped to 1 item", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "page.negative@example.com",
      password: "Password123!",
    });

    for (let i = 0; i < 3; i++) {
      await testApp.client.post("/v1/companies", {
        legalName: `Company Neg ${i}`,
        displayName: `Neg ${i}`,
        domain: `neg${i}.com`,
      });
    }

    const res = await testApp.client.get("/v1/companies?limit=-5");
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
  });

  it("2. zero limit parameter (limit=0) is clamped to 1 item", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "page.zero@example.com",
      password: "Password123!",
    });

    for (let i = 0; i < 3; i++) {
      await testApp.client.post("/v1/companies", {
        legalName: `Company Zero ${i}`,
        displayName: `Zero ${i}`,
        domain: `zero${i}.com`,
      });
    }

    const res = await testApp.client.get("/v1/companies?limit=0");
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
  });

  it("3. excessive limit parameter (limit=500) is clamped to maximum bound of 100", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "page.excess@example.com",
      password: "Password123!",
    });

    // Populate 120 items in state engine directly for speed
    const wsId = Array.from(testApp.stateEngine.users.values()).find(
      (u) => u.email === "page.excess@example.com"
    ).workspaceIds[0].toString();

    for (let i = 0; i < 110; i++) {
      await testApp.stateEngine.createCompanyRepo().create({
        workspaceId: wsId,
        legalName: `Bulk Co ${i}`,
        displayName: `Bulk ${i}`,
        domain: `bulk${i}.com`,
      });
    }

    const res = await testApp.client.get("/v1/companies?limit=500");
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(100);
    expect(res.body.hasMore).toBe(true);
    expect(res.body.nextCursor).toBeDefined();
  });

  it("4. omitted limit parameter defaults to standard page size of 50", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "page.default@example.com",
      password: "Password123!",
    });

    const wsId = Array.from(testApp.stateEngine.users.values()).find(
      (u) => u.email === "page.default@example.com"
    ).workspaceIds[0].toString();

    for (let i = 0; i < 60; i++) {
      await testApp.stateEngine.createCompanyRepo().create({
        workspaceId: wsId,
        legalName: `Def Co ${i}`,
        displayName: `Def ${i}`,
        domain: `def${i}.com`,
      });
    }

    const res = await testApp.client.get("/v1/companies");
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(50);
    expect(res.body.hasMore).toBe(true);
  });

  it("5. querying empty collection returns items: [], nextCursor: null, hasMore: false", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "page.empty@example.com",
      password: "Password123!",
    });

    const res = await testApp.client.get("/v1/recruiters");
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.nextCursor).toBeNull();
    expect(res.body.hasMore).toBe(false);
  });

  it("6. deep cursor traversal: iterating 30 items with limit=10 retrieves all 30 items with zero duplicates", async () => {
    await testApp.client.post("/v1/auth/register", {
      email: "page.traverse@example.com",
      password: "Password123!",
    });

    const wsId = Array.from(testApp.stateEngine.users.values()).find(
      (u) => u.email === "page.traverse@example.com"
    ).workspaceIds[0].toString();

    for (let i = 0; i < 30; i++) {
      await testApp.stateEngine.createCompanyRepo().create({
        workspaceId: wsId,
        legalName: `Paged Co ${String(i).padStart(2, "0")}`,
        displayName: `Paged ${i}`,
        domain: `paged${i}.com`,
      });
    }

    const collectedIds = new Set<string>();
    let cursor: string | null = null;
    let pages = 0;

    do {
      const url = cursor ? `/v1/companies?limit=10&cursor=${cursor}` : "/v1/companies?limit=10";
      const res = await testApp.client.get(url);
      expect(res.status).toBe(200);

      for (const item of res.body.items) {
        expect(collectedIds.has(item._id.toString())).toBe(false); // No duplicate items
        collectedIds.add(item._id.toString());
      }

      cursor = res.body.nextCursor;
      pages++;
    } while (cursor && pages < 10);

    expect(collectedIds.size).toBe(30);
    expect(pages).toBe(3);
  });
});
