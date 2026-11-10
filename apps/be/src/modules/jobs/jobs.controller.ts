/**
 * Jobs controller.
 *
 * Workspace-scoped job postings management with RBAC enforcement.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JobsService } from "./jobs.service";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { Permissions, CurrentUser } from "../../common/decorators";
import {
  PERMISSIONS,
  CreateJobSchema,
  UpdateJobSchema,
  type CreateJobInput,
  type UpdateJobInput,
} from "@career-intelligence/shared";

@ApiTags("jobs")
@ApiBearerAuth()
@Controller("jobs")
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  @Permissions(PERMISSIONS.JOB_READ)
  @ApiOperation({ summary: "List workspace job postings" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "cursor", required: false, type: String })
  @ApiResponse({ status: 200, description: "Job postings list retrieved" })
  async list(
    @CurrentUser() user: any,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
  ) {
    const workspaceId = user.workspaceIds[0];
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.jobs.list(workspaceId, { limit: parsedLimit, cursor });
  }

  @Get(":id")
  @Permissions(PERMISSIONS.JOB_READ)
  @ApiOperation({ summary: "Get job posting by ID" })
  @ApiResponse({ status: 200, description: "Job posting details" })
  async getById(@CurrentUser() user: any, @Param("id") id: string) {
    const workspaceId = user.workspaceIds[0];
    return this.jobs.getById(id, workspaceId);
  }

  @Post()
  @Permissions(PERMISSIONS.JOB_WRITE)
  @ApiOperation({ summary: "Create a job posting record" })
  @ApiResponse({ status: 201, description: "Job posting created" })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateJobSchema)) body: CreateJobInput,
  ) {
    const workspaceId = user.workspaceIds[0];
    return this.jobs.create(body as any, workspaceId);
  }

  @Patch(":id")
  @Permissions(PERMISSIONS.JOB_WRITE)
  @ApiOperation({ summary: "Update job posting" })
  @ApiResponse({ status: 200, description: "Job posting updated" })
  async update(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateJobSchema)) body: UpdateJobInput,
  ) {
    const workspaceId = user.workspaceIds[0];
    return this.jobs.update(id, body as any, workspaceId);
  }

  @Delete(":id")
  @Permissions(PERMISSIONS.JOB_WRITE)
  @ApiOperation({ summary: "Soft delete job posting" })
  @ApiResponse({ status: 200, description: "Job posting deleted" })
  async delete(@CurrentUser() user: any, @Param("id") id: string) {
    const workspaceId = user.workspaceIds[0];
    return this.jobs.delete(id, workspaceId);
  }
}
