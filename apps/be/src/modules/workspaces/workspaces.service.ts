/**
 * Workspaces service.
 *
 * Implements workspace management, member scoping, and provisioning.
 */

import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import {
  WorkspaceRepository,
  MembershipRepository,
} from "@career-intelligence/database";
import { SeedService } from "../seed/seed.service";
import {
  NotFoundError,
  ForbiddenError,
  ROLES,
} from "@career-intelligence/shared";

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly workspaces: WorkspaceRepository,
    private readonly memberships: MembershipRepository,
    private readonly seed: SeedService,
  ) {}

  async listForUser(workspaceIds: string[]) {
    return this.workspaces.findByIds(workspaceIds);
  }

  async getById(id: string, userWorkspaceIds: string[]) {
    if (!userWorkspaceIds.includes(id)) {
      throw new ForbiddenError("Access denied to this workspace");
    }
    const ws = await this.workspaces.findById(id);
    if (!ws) {
      throw new NotFoundError("Workspace", id);
    }
    return ws;
  }

  async create(data: { name: string; slug: string }, userId: string) {
    const created = await this.workspaces.create({
      name: data.name,
      slug: data.slug,
      ownerId: new Types.ObjectId(userId) as any,
    });
    if (!created) {
      throw new Error('Failed to create workspace');
    }
    const workspaceId = created._id.toString();

    // Seed default permissions and roles
    await this.seed.seedWorkspace(workspaceId);

    // Assign creating user the Admin role
    await this.memberships.create({
      userId: new Types.ObjectId(userId),
      workspaceId: created._id,
      role: ROLES.ADMIN,
    });

    return created;
  }
}
