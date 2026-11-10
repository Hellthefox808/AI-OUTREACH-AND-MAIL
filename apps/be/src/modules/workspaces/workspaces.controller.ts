/**
 * Workspaces controller.
 *
 * Workspace management and membership listing.
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { z } from "zod";
import { WorkspacesService } from "./workspaces.service";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { Permissions, CurrentUser, WorkspaceAgnostic } from "../../common/decorators";
import { PERMISSIONS } from "@career-intelligence/shared";

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase alphanumeric characters and hyphens"),
});

type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;

@ApiTags("workspaces")
@ApiBearerAuth()
@Controller("workspaces")
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Get()
  @WorkspaceAgnostic()
  @ApiOperation({ summary: "List workspaces the user is a member of" })
  @ApiResponse({ status: 200, description: "Workspaces list retrieved" })
  async list(@CurrentUser() user: any) {
    return this.workspaces.listForUser(user.workspaceIds);
  }

  @Get(":workspaceId")
  @Permissions(PERMISSIONS.WORKSPACE_READ)
  @ApiOperation({ summary: "Get workspace details by ID" })
  @ApiResponse({ status: 200, description: "Workspace details" })
  async getById(@CurrentUser() user: any, @Param("workspaceId") workspaceId: string) {
    return this.workspaces.getById(workspaceId, user.workspaceIds);
  }

  @Post()
  @WorkspaceAgnostic()
  @ApiOperation({ summary: "Create a new workspace" })
  @ApiResponse({ status: 201, description: "Workspace created" })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateWorkspaceSchema)) body: CreateWorkspaceInput,
  ) {
    return this.workspaces.create(body, user.id);
  }
}
