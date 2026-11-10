/**
 * Users controller.
 *
 * Current user profile and account inspection.
 */

import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CurrentUser, WorkspaceAgnostic } from "../../common/decorators";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
@WorkspaceAgnostic()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "Current user profile" })
  async me(@CurrentUser() user: any) {
    return this.users.me(user.id);
  }
}
