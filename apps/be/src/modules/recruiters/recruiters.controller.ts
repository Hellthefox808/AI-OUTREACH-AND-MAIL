/**
 * Recruiters controller.
 *
 * Workspace-scoped recruiter contact management with RBAC enforcement.
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
import { RecruitersService } from "./recruiters.service";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { Permissions, CurrentUser } from "../../common/decorators";
import {
  PERMISSIONS,
  CreateRecruiterSchema,
  UpdateRecruiterSchema,
  type CreateRecruiterInput,
  type UpdateRecruiterInput,
} from "@career-intelligence/shared";

@ApiTags("recruiters")
@ApiBearerAuth()
@Controller("recruiters")
export class RecruitersController {
  constructor(private readonly recruiters: RecruitersService) {}

  @Get()
  @Permissions(PERMISSIONS.RECRUITER_READ)
  @ApiOperation({ summary: "List workspace recruiters with filtering" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "cursor", required: false, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "verificationStatus", required: false, type: String })
  @ApiQuery({ name: "companyId", required: false, type: String })
  @ApiResponse({ status: 200, description: "Recruiter list retrieved" })
  async list(
    @CurrentUser() user: any,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
    @Query("search") search?: string,
    @Query("verificationStatus") verificationStatus?: string,
    @Query("companyId") companyId?: string,
  ) {
    const workspaceId = user.workspaceIds[0];
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.recruiters.list(
      workspaceId,
      { limit: parsedLimit, cursor },
      { search, verificationStatus, companyId }
    );
  }

  @Get("export")
  @Permissions(PERMISSIONS.RECRUITER_READ)
  @ApiOperation({ summary: "Export recruiter contacts as CSV or JSON" })
  @ApiQuery({ name: "format", required: false, enum: ["json", "csv"] })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "verificationStatus", required: false, type: String })
  @ApiResponse({ status: 200, description: "Exported recruiter contacts" })
  async export(
    @CurrentUser() user: any,
    @Query("format") format: "json" | "csv" = "json",
    @Query("search") search?: string,
    @Query("verificationStatus") verificationStatus?: string,
  ) {
    const workspaceId = user.workspaceIds[0];
    return this.recruiters.export(
      workspaceId,
      { search, verificationStatus },
      format
    );
  }

  @Get(":id")
  @Permissions(PERMISSIONS.RECRUITER_READ)
  @ApiOperation({ summary: "Get recruiter by ID" })
  @ApiResponse({ status: 200, description: "Recruiter details" })
  async getById(@CurrentUser() user: any, @Param("id") id: string) {
    const workspaceId = user.workspaceIds[0];
    return this.recruiters.getById(id, workspaceId);
  }

  @Post()
  @Permissions(PERMISSIONS.RECRUITER_WRITE)
  @ApiOperation({ summary: "Create a recruiter contact record" })
  @ApiResponse({ status: 201, description: "Recruiter created" })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateRecruiterSchema)) body: CreateRecruiterInput,
  ) {
    const workspaceId = user.workspaceIds[0];
    return this.recruiters.create(body as any, workspaceId);
  }

  @Patch(":id")
  @Permissions(PERMISSIONS.RECRUITER_WRITE)
  @ApiOperation({ summary: "Update recruiter contact" })
  @ApiResponse({ status: 200, description: "Recruiter updated" })
  async update(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateRecruiterSchema)) body: UpdateRecruiterInput,
  ) {
    const workspaceId = user.workspaceIds[0];
    return this.recruiters.update(id, body as any, workspaceId);
  }

  @Delete(":id")
  @Permissions(PERMISSIONS.RECRUITER_WRITE)
  @ApiOperation({ summary: "Soft delete recruiter" })
  @ApiResponse({ status: 200, description: "Recruiter deleted" })
  async delete(@CurrentUser() user: any, @Param("id") id: string) {
    const workspaceId = user.workspaceIds[0];
    return this.recruiters.delete(id, workspaceId);
  }
}
