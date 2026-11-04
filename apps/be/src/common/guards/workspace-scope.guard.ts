/**
 * WorkspaceScopeGuard.
 *
 * Ensures the workspace being accessed (from route param `workspaceId`, body,
 * or query) is one the authenticated user is a member of. Default-deny: no
 * matching membership means 403. Routes that are workspace-agnostic (e.g.
 * /auth/*) skip this guard.
 */

import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

const WORKSPACE_AGNOSTIC_KEY = "workspaceAgnostic";

@Injectable()
export class WorkspaceScopeGuard {
  private readonly logger = new Logger(WorkspaceScopeGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const workspaceAgnostic = this.reflector.get<boolean>(
      WORKSPACE_AGNOSTIC_KEY,
      context.getHandler()
    );
    if (workspaceAgnostic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException("Authentication required");
    }

    const workspaceId =
      request.params?.workspaceId ||
      request.body?.workspaceId ||
      request.query?.workspaceId;

    if (!workspaceId) {
      // No workspace targeted; allow (caller must scope explicitly).
      return true;
    }

    const userWorkspaceIds: string[] = (user.workspaceIds || []).map((id: any) =>
      id.toString()
    );

    if (!userWorkspaceIds.includes(workspaceId)) {
      this.logger.warn(
        `User ${user.id} not a member of workspace ${workspaceId}`
      );
      throw new ForbiddenException("Access denied to this workspace");
    }

    return true;
  }
}
