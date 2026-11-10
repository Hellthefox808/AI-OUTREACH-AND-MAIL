/**
 * Companies controller.
 *
 * Workspace-scoped company management with RBAC enforcement.
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
import { CompaniesService } from "./companies.service";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { Permissions, CurrentUser } from "../../common/decorators";
import {
  PERMISSIONS,
  CreateCompanySchema,
  UpdateCompanySchema,
  type CreateCompanyInput,
  type UpdateCompanyInput,
} from "@career-intelligence/shared";

@ApiTags("companies")
@ApiBearerAuth()
@Controller("companies")
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  @Permissions(PERMISSIONS.COMPANY_READ)
  @ApiOperation({ summary: "List workspace companies" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "cursor", required: false, type: String })
  @ApiResponse({ status: 200, description: "Company list retrieved" })
  async list(
    @CurrentUser() user: any,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
  ) {
    const workspaceId = user.workspaceIds[0];
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.companies.list(workspaceId, { limit: parsedLimit, cursor });
  }

  @Get(":id")
  @Permissions(PERMISSIONS.COMPANY_READ)
  @ApiOperation({ summary: "Get company by ID" })
  @ApiResponse({ status: 200, description: "Company details" })
  async getById(@CurrentUser() user: any, @Param("id") id: string) {
    const workspaceId = user.workspaceIds[0];
    return this.companies.getById(id, workspaceId);
  }

  @Post()
  @Permissions(PERMISSIONS.COMPANY_WRITE)
  @ApiOperation({ summary: "Create a company record" })
  @ApiResponse({ status: 201, description: "Company created" })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateCompanySchema)) body: CreateCompanyInput,
  ) {
    const workspaceId = user.workspaceIds[0];
    return this.companies.create(body as any, workspaceId);
  }

  @Patch(":id")
  @Permissions(PERMISSIONS.COMPANY_WRITE)
  @ApiOperation({ summary: "Update company details" })
  @ApiResponse({ status: 200, description: "Company updated" })
  async update(
    @CurrentUser() user: any,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateCompanySchema)) body: UpdateCompanyInput,
  ) {
    const workspaceId = user.workspaceIds[0];
    return this.companies.update(id, body as any, workspaceId);
  }

  @Delete(":id")
  @Permissions(PERMISSIONS.COMPANY_WRITE)
  @ApiOperation({ summary: "Soft delete company" })
  @ApiResponse({ status: 200, description: "Company deleted" })
  async delete(@CurrentUser() user: any, @Param("id") id: string) {
    const workspaceId = user.workspaceIds[0];
    return this.companies.delete(id, workspaceId);
  }
}
