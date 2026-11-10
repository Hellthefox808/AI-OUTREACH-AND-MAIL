/**
 * Tier 1: Workspaces & RBAC Multi-Tenant Resolution E2E Tests.
 *
 * Covers:
 * - F7: Multi-Tenant Workspace Resolution (>=5 tests)
 * - F8: Workspace Creation User Linkage (>=5 tests)
 * - F9: RBAC & Permission Resolution (>=5 tests)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createE2ETestApp, TestAppInstance } from "../harness/app-test-factory";
import { ROLES, PERMISSIONS } from "@career-intelligence/shared";

describe("Tier 1: Workspaces & RBAC Multi-Tenant Resolution E2E Suite", () => {
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

  // --------------------------------------------------------------------------
  // F7: Multi-Tenant Workspace Resolution
  // --------------------------------------------------------------------------
  describe("F7: Multi-Tenant Workspace Resolution", () => {
    it("1. lists all workspaces the authenticated user is a member of", async () => {
      const reg = await testApp.client.post("/v1/auth/register", {
        email: "ws.lister@example.com",
        password: "Password123!",
      });
      const wsId = reg.body.user.workspaceId;

      const res = await testApp.client.get("/v1/workspaces");
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      const found = res.body.find((w: any) => w._id.toString() === wsId);
      expect(found).toBeDefined();
    });

    it("2. retrieves workspace details by ID for member workspace", async () => {
      const reg = await testApp.client.post("/v1/auth/register", {
        email: "ws.detail@example.com",
        password: "Password123!",
      });
      const wsId = reg.body.user.workspaceId;

      const res = await testApp.client.get(`/v1/workspaces/${wsId}`);
      expect(res.status).toBe(200);
      expect(res.body._id.toString()).toBe(wsId);
    });

    it("3. rejects access with 403 Forbidden when accessing workspace user is not a member of", async () => {
      // User A
      const userA = await testApp.client.post("/v1/auth/register", {
        email: "userA.isolation@example.com",
        password: "Password123!",
      });
      const wsAId = userA.body.user.workspaceId;

      // User B
      testApp.client.clearAuth();
      await testApp.client.post("/v1/auth/register", {
        email: "userB.isolation@example.com",
        password: "Password123!",
      });

      // User B attempts to access User A's workspace
      const res = await testApp.client.get(`/v1/workspaces/${wsAId}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Access denied to this workspace");
    });

    it("4. supports tenant switching via x-workspace-id request header", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "tenant.switcher@example.com",
        password: "Password123!",
      });

      // Create a second workspace for this user
      const createRes = await testApp.client.post("/v1/workspaces", {
        name: "Secondary Workspace",
        slug: "secondary-ws",
      });
      expect(createRes.status).toBe(201);
      const secondWsId = createRes.body._id.toString();

      // Ensure user.workspaceIds includes secondWsId (simulating F8 linkage)
      const user = Array.from(testApp.stateEngine.users.values()).find(
        (u) => u.email === "tenant.switcher@example.com"
      );
      user.workspaceIds.push(secondWsId);

      // Pass second workspace ID via header
      testApp.client.setWorkspaceId(secondWsId);
      const res = await testApp.client.get(`/v1/workspaces/${secondWsId}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Secondary Workspace");
    });

    it("5. rejects unauthenticated workspace listing with 401 Unauthorized", async () => {
      testApp.client.clearAuth();
      const res = await testApp.client.get("/v1/workspaces");
      expect(res.status).toBe(401);
    });
  });

  // --------------------------------------------------------------------------
  // F8: Workspace Creation User Linkage
  // --------------------------------------------------------------------------
  describe("F8: Workspace Creation User Linkage", () => {
    it("1. creates a new workspace via POST /v1/workspaces and returns 201 Created", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "ws.creator@example.com",
        password: "Password123!",
      });

      const res = await testApp.client.post("/v1/workspaces", {
        name: "Acme Innovations",
        slug: "acme-innovations",
      });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Acme Innovations");
      expect(res.body.slug).toBe("acme-innovations");
      expect(res.body._id).toBeDefined();
    });

    it("2. links new workspace ID to user owner identity in membership", async () => {
      const reg = await testApp.client.post("/v1/auth/register", {
        email: "ws.linker@example.com",
        password: "Password123!",
      });
      const userId = reg.body.user.id;

      const createRes = await testApp.client.post("/v1/workspaces", {
        name: "Linked Workspace",
        slug: "linked-ws",
      });
      const wsId = createRes.body._id.toString();

      const membership = await testApp.stateEngine.memberships.get(
        Array.from(testApp.stateEngine.memberships.values()).find(
          (m) => m.userId.toString() === userId.toString() && m.workspaceId.toString() === wsId
        )?._id.toString()
      );
      expect(membership).toBeDefined();
    });

    it("3. assigns creator the ADMIN role in the newly created workspace", async () => {
      const reg = await testApp.client.post("/v1/auth/register", {
        email: "ws.admin@example.com",
        password: "Password123!",
      });
      const userId = reg.body.user.id;

      const createRes = await testApp.client.post("/v1/workspaces", {
        name: "Admin Role Workspace",
        slug: "admin-role-ws",
      });
      const wsId = createRes.body._id.toString();

      const membership = Array.from(testApp.stateEngine.memberships.values()).find(
        (m) => m.userId.toString() === userId.toString() && m.workspaceId.toString() === wsId
      );
      expect(membership).toBeDefined();
      expect(membership.role).toBe(ROLES.ADMIN);
    });

    it("4. automatically seeds default permissions and roles for newly created workspace", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "seed.validator@example.com",
        password: "Password123!",
      });

      const createRes = await testApp.client.post("/v1/workspaces", {
        name: "Seeded Workspace",
        slug: "seeded-ws",
      });
      const wsId = createRes.body._id.toString();

      const seededRoles = Array.from(testApp.stateEngine.roles.values()).filter(
        (r) => r.workspaceId.toString() === wsId
      );
      expect(seededRoles.length).toBeGreaterThanOrEqual(3); // admin, member, viewer

      const seededPermissions = Array.from(testApp.stateEngine.permissions.values()).filter(
        (p) => p.workspaceId.toString() === wsId
      );
      expect(seededPermissions.length).toBeGreaterThanOrEqual(20);
    });

    it("5. validates workspace slug format (rejects uppercase and invalid characters)", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "slug.validator@example.com",
        password: "Password123!",
      });

      const res = await testApp.client.post("/v1/workspaces", {
        name: "Invalid Slug Workspace",
        slug: "Invalid_Slug_With_Uppercase!",
      });

      expect(res.status).toBe(400);
    });
  });

  // --------------------------------------------------------------------------
  // F9: RBAC & Permission Resolution
  // --------------------------------------------------------------------------
  describe("F9: RBAC & Permission Resolution", () => {
    it("1. admin user has full permissions to access workspace resources", async () => {
      const reg = await testApp.client.post("/v1/auth/register", {
        email: "rbac.admin@example.com",
        password: "Password123!",
      });

      expect(reg.body.user.permissions).toContain(PERMISSIONS.WORKSPACE_READ);
      expect(reg.body.user.permissions).toContain(PERMISSIONS.COMPANY_READ);
      expect(reg.body.user.permissions).toContain(PERMISSIONS.COMPANY_WRITE);
    });

    it("2. user missing required permission receives 403 Forbidden with descriptive message", async () => {
      const reg = await testApp.client.post("/v1/auth/register", {
        email: "rbac.restricted@example.com",
        password: "Password123!",
      });
      const wsId = reg.body.user.workspaceId;

      // Demote user role to VIEWER in state engine
      const membership = Array.from(testApp.stateEngine.memberships.values()).find(
        (m) => m.workspaceId.toString() === wsId
      );
      membership.role = ROLES.VIEWER;

      // Re-login to get updated token without company:write permission
      testApp.client.clearAuth();
      const loginRes = await testApp.client.post("/v1/auth/login", {
        email: "rbac.restricted@example.com",
        password: "Password123!",
      });

      expect(loginRes.body.user.permissions).not.toContain(PERMISSIONS.COMPANY_WRITE);

      // Attempt write operation that requires company:write
      const createCompanyRes = await testApp.client.post("/v1/companies", {
        legalName: "Unauthorized Co",
        displayName: "Unauthorized",
        domain: "unauthorized.com",
      });

      expect(createCompanyRes.status).toBe(403);
      expect(createCompanyRes.body.message).toContain("Insufficient permissions");
    });

    it("3. viewer role allows reading workspace resources successfully", async () => {
      const reg = await testApp.client.post("/v1/auth/register", {
        email: "rbac.viewer@example.com",
        password: "Password123!",
      });
      const wsId = reg.body.user.workspaceId;

      // Demote to VIEWER
      const membership = Array.from(testApp.stateEngine.memberships.values()).find(
        (m) => m.workspaceId.toString() === wsId
      );
      membership.role = ROLES.VIEWER;

      testApp.client.clearAuth();
      await testApp.client.post("/v1/auth/login", {
        email: "rbac.viewer@example.com",
        password: "Password123!",
      });

      // Reading should succeed with 200
      const listRes = await testApp.client.get("/v1/companies");
      expect(listRes.status).toBe(200);
    });

    it("4. public endpoints bypass RBAC check completely", async () => {
      testApp.client.clearAuth();
      const healthRes = await testApp.client.get("/v1/health");
      expect(healthRes.status).toBe(200);
    });

    it("5. workspace-agnostic endpoints allow authenticated calls across workspaces", async () => {
      await testApp.client.post("/v1/auth/register", {
        email: "agnostic.test@example.com",
        password: "Password123!",
      });

      const meRes = await testApp.client.get("/v1/users/me");
      expect(meRes.status).toBe(200);
      expect(meRes.body.email).toBe("agnostic.test@example.com");
    });
  });
});
