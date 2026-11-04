/**
 * AuthGuard.
 *
 * Extracts the access token from the HTTP-only cookie, verifies the JWT,
 * validates the user still exists, and attaches `req.user`. Default-deny: no
 * valid token means 401.
 */

import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../../modules/auth/auth.service";

@Injectable()
export class AuthGuard {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.access_token;

    if (!token) {
      throw new UnauthorizedException("Missing access token");
    }

    let payload: any;
    try {
      const secret = this.config.get<string>("JWT_ACCESS_SECRET");
      payload = this.jwt.verify(token, { secret });
    } catch (err) {
      this.logger.warn("Invalid access token", String((err as Error)?.message));
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
