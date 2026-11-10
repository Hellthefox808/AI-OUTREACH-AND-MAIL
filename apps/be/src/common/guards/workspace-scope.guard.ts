/**
 * WorkspaceScopeGuard.
 *
 * Ensures the workspace being accessed (from route param `workspaceId`, body,
 * or query) is one the authenticated user is a member of. Default-deny: no
 * matching membership means 403. Routes that are public or workspace-agnostic
 * (e.g. /auth/*, /health) skip this guard.
 */

import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { WORKSPACE_AGNOSTIC_KEY, IS_PUBLIC_KEY } from "../decorators";

@Injectable()
export class WorkspaceScopeGuard {
  private readonly logger = new Logger(WorkspaceScopeGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const workspaceAgnostic = this.reflector.getAllAndOverride<boolean>(
      WORKSPACE_AGNOSTIC_KEY,
      [context.getHandler(), context.getClass()]
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

    const userWorkspaceIds: string[] = (user.workspaceIds || []).map((id: { toString(): string } | string) =>
      id.toString()
    );

    if (!userWorkspaceIds.includes(String(workspaceId))) {
      this.logger.warn(
        `User ${user.id} not a member of workspace ${workspaceId}`
      );
      throw new ForbiddenException("Access denied to this workspace");
    }

    return true;
  }
}
