/**
 * Seed service.
 *
 * Ensures default permissions and roles exist for every workspace on module
 * initialization. This makes RBAC functional from the first workspace without
 * requiring manual provisioning.
 *
 * Roles:
 *   ADMIN   — all permissions
 *   MEMBER  — read/write for most resources
 *   VIEWER  — read-only access
 */

import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { Types } from "mongoose";
import { WorkspaceRepository } from "@career-intelligence/database";
import { PermissionRepository } from "@career-intelligence/database";
import { RoleRepository } from "@career-intelligence/database";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  type PermissionKey,
  type RoleKey,
} from "@career-intelligence/shared";

const PERMISSION_DESCRIPTIONS: Record<PermissionKey, string> = {
  [PERMISSIONS.AUTH_LOGIN]: "Log in to the application",
  [PERMISSIONS.AUTH_LOGOUT]: "Log out of the application",
  [PERMISSIONS.AUTH_MANAGE_USERS]: "Manage user accounts",
  [PERMISSIONS.WORKSPACE_READ]: "Read workspace details",
  [PERMISSIONS.WORKSPACE_WRITE]: "Create and update workspaces",
  [PERMISSIONS.WORKSPACE_MANAGE_MEMBERS]: "Manage workspace members",
  [PERMISSIONS.COMPANY_READ]: "Read company records",
  [PERMISSIONS.COMPANY_WRITE]: "Create and update company records",
  [PERMISSIONS.COMPANY_RESEARCH]: "Research companies",
  [PERMISSIONS.RECRUITER_READ]: "Read recruiter records",
  [PERMISSIONS.RECRUITER_WRITE]: "Create and update recruiter records",
  [PERMISSIONS.RECRUITER_DISCOVER]: "Discover recruiters",
  [PERMISSIONS.JOB_READ]: "Read job postings",
  [PERMISSIONS.JOB_WRITE]: "Create and update job postings",
  [PERMISSIONS.JOB_DISCOVER]: "Discover jobs",
  [PERMISSIONS.CANDIDATE_READ]: "Read candidate profiles",
  [PERMISSIONS.CANDIDATE_WRITE]: "Create and update candidate profiles",
  [PERMISSIONS.RESUME_READ]: "Read resume records",
  [PERMISSIONS.RESUME_WRITE]: "Create and update resume records",
  [PERMISSIONS.CONTENT_READ]: "Read content templates",
  [PERMISSIONS.CONTENT_WRITE]: "Create and update content templates",
  [PERMISSIONS.CONTENT_APPROVE]: "Approve content templates",
  [PERMISSIONS.CAMPAIGN_READ]: "Read outreach campaigns",
  [PERMISSIONS.CAMPAIGN_WRITE]: "Create and update campaigns",
  [PERMISSIONS.CAMPAIGN_SEND]: "Send campaign emails",
  [PERMISSIONS.MAILBOX_READ]: "Read mailbox records",
  [PERMISSIONS.MAILBOX_WRITE]: "Create and update mailbox records",
  [PERMISSIONS.MAILBOX_SYNC]: "Synchronize mailbox",
  [PERMISSIONS.RESEARCH_READ]: "Read research runs",
  [PERMISSIONS.RESEARCH_WRITE]: "Create and update research runs",
  [PERMISSIONS.VERIFICATION_READ]: "Read contact verifications",
  [PERMISSIONS.VERIFICATION_WRITE]: "Create and update contact verifications",
  [PERMISSIONS.ANALYTICS_READ]: "Read analytics",
  [PERMISSIONS.ADMIN_AUDIT]: "Read audit events",
  [PERMISSIONS.ADMIN_SETTINGS]: "Manage system settings",
  [PERMISSIONS.ADMIN_SYSTEM]: "Administer system",
};

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly workspaces: WorkspaceRepository,
    private readonly permissions: PermissionRepository,
    private readonly roles: RoleRepository,
  ) {}

  async onModuleInit() {
    try {
      // Seeding is triggered per-workspace when a workspace is created.
      // This method is a no-op until workspaces exist.
      this.logger.log(
        "Seed service initialized. Permissions and roles are seeded per workspace on creation.",
      );
    } catch (error) {
      // Non-fatal: seeding failure should not prevent application startup
      this.logger.warn(`Seed service failed: ${(error as Error).message}`);
    }
  }

  /**
   * Ensures default permissions and roles exist for a workspace.
   * Call this after creating a new workspace.
   */
  async seedWorkspace(workspaceId: string) {
    const workspaceObjectId = new Types.ObjectId(workspaceId);

    // Seed permissions
    const permissionMap = new Map<string, Types.ObjectId>();
    for (const [key, description] of Object.entries(
      PERMISSION_DESCRIPTIONS,
    ) as [PermissionKey, string][]) {
      let perm = await this.permissions.findByKey(key, workspaceObjectId);
      if (!perm) {
        perm = await this.permissions.create({
          workspaceId: workspaceObjectId,
          key,
          description,
          isSystem: true,
        });
      }
      permissionMap.set(key, (perm as any)._id as Types.ObjectId);
    }

    // Seed roles
    for (const [roleName, permissionKeys] of Object.entries(
      ROLE_PERMISSIONS,
    ) as [RoleKey, PermissionKey[]][]) {
      const role = await this.roles.findByName(roleName, workspaceObjectId);
      const rolePermissionIds: Types.ObjectId[] = permissionKeys
        .map((k) => permissionMap.get(k))
        .filter((id): id is Types.ObjectId => id !== undefined);

      if (!role) {
        await this.roles.create({
          workspaceId: workspaceObjectId,
          name: roleName,
          description: `Default ${roleName} role`,
          permissionIds: rolePermissionIds,
          isSystem: true,
        });
      } else {
        await this.roles.updateById(
          (role as any)._id,
          { permissionIds: rolePermissionIds },
          workspaceObjectId,
        );
      }
    }

    this.logger.log(
      `Seeded permissions and roles for workspace ${workspaceId}`,
    );
  }
}
