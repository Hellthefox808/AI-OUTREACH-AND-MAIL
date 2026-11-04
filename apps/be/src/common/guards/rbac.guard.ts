/**
 * RbacGuard.
 *
 * Checks that the authenticated user holds the permission(s) required by the
 * route. Required permissions are declared via `@SetMetadata("permissions", ...)`.
 * Default-deny: missing permission means 403.
 */

import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

const PERMISSIONS_KEY = "permissions";

@Injectable()
export class RbacGuard {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      PERMISSIONS_KEY,
      context.getHandler()
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException("Authentication required");
    }

    // Workspace-scoped permission check: a user holds a permission if any of
    // their roles in the relevant workspace grants it. Role/permission
    // resolution happens in the service layer via the PermissionPolicy;
    // here we enforce that the user's token carries the permission claim.
    const userPermissions: string[] = user.permissions || [];

    const missing = requiredPermissions.filter(
      (p) => !userPermissions.includes(p)
    );

    if (missing.length > 0) {
      this.logger.warn(
        `User ${user.id} missing permissions: ${missing.join(", ")}`
      );
      throw new ForbiddenException(`Insufficient permissions: ${missing.join(", ")}`);
    }

    return true;
  }
}
