/**
 * AuthGuard.
 *
 * Extracts the access token from the HTTP-only cookie or Authorization Bearer header,
 * verifies the JWT, validates the user still exists, and attaches `req.user`.
 * Default-deny: routes not explicitly decorated with `@Public()` require a valid token.
 */

import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../../modules/auth/auth.service";
import { IS_PUBLIC_KEY } from "../decorators";

interface JwtPayload {
  sub: string;
  email: string;
  workspaceId: string;
  permissions?: string[];
  [key: string]: unknown;
}

@Injectable()
export class AuthGuard {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    let token = request.cookies?.access_token;

    if (!token && typeof request.headers?.authorization === "string") {
      const [scheme, credentials] = request.headers.authorization.split(" ");
      if (scheme?.toLowerCase() === "bearer" && credentials) {
        token = credentials.trim();
      }
    }

    if (!token) {
      throw new UnauthorizedException("Missing access token");
    }

    let payload: JwtPayload;
    try {
      const secret = this.config.get<string>("JWT_ACCESS_SECRET");
      payload = this.jwt.verify<JwtPayload>(token, { secret });
    } catch (err) {
      this.logger.warn(`Invalid access token: ${String((err as Error)?.message)}`);
      throw new UnauthorizedException("Invalid or expired access token");
    }

    const user = await this.auth.validateUser(
      payload.sub,
      payload.workspaceId,
    );
    if (!user) {
      throw new UnauthorizedException("User not found or inactive");
    }

    request.user = user;
    return true;
  }
}
