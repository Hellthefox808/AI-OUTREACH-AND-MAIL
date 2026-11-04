/**
 * Auth module — application authentication boundary.
 *
 * Identity (OIDC / sessions) is implemented here. Mailbox OAuth provider
 * credentials live in the mailbox module and are kept separate.
 */

import { Module } from "@nestjs/common";
import { DatabaseModule } from "@career-intelligence/database";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
