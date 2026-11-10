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
  @ApiOperation({ summary: "List workspace job postings with filtering" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "cursor", required: false, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "workMode", required: false, type: String })
  @ApiQuery({ name: "type", required: false, type: String })
  @ApiQuery({ name: "isActive", required: false, type: Boolean })
  @ApiResponse({ status: 200, description: "Job postings list retrieved" })
  async list(
    @CurrentUser() user: any,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
    @Query("search") search?: string,
    @Query("workMode") workMode?: string,
    @Query("type") type?: string,
    @Query("isActive") isActive?: string,
  ) {
    const workspaceId = user.workspaceIds[0];
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const activeBool = isActive !== undefined ? isActive === "true" : undefined;
    return this.jobs.list(
      workspaceId,
      { limit: parsedLimit, cursor },
      { search, workMode, type, isActive: activeBool }
    );
  }

  @Get("export")
  @Permissions(PERMISSIONS.JOB_READ)
  @ApiOperation({ summary: "Export job postings as CSV or JSON" })
  @ApiQuery({ name: "format", required: false, enum: ["json", "csv"] })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "workMode", required: false, type: String })
  @ApiResponse({ status: 200, description: "Exported job postings" })
  async export(
    @CurrentUser() user: any,
    @Query("format") format: "json" | "csv" = "json",
    @Query("search") search?: string,
    @Query("workMode") workMode?: string,
  ) {
    const workspaceId = user.workspaceIds[0];
    return this.jobs.export(workspaceId, { search, workMode }, format);
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
