/**
 * RbacGuard.
 *
 * Checks that the authenticated user holds the permission(s) required by the
 * route. Required permissions are declared via `@Permissions(...)`.
 * Default-deny: missing permission means 403. Public routes bypass RBAC.
 */

import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from "../decorators";

@Injectable()
export class RbacGuard {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException("Authentication required");
    }

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
