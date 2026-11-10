/**
 * Analytics Controller.
 *
 * Workspace-scoped analytics and data aggregation endpoints.
 */

import { Controller, Get, Post, Body } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { Permissions, CurrentUser } from "../../common/decorators";
import { PERMISSIONS, type DataChatRequest } from "@career-intelligence/shared";

@ApiTags("analytics")
@ApiBearerAuth()
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get("overview")
  @Permissions(PERMISSIONS.ANALYTICS_READ)
  @ApiOperation({ summary: "Get workspace analytics overview and 7-day trends" })
  @ApiResponse({
    status: 200,
    description: "Workspace analytics overview retrieved successfully",
  })
  async getOverview(@CurrentUser() user: any) {
    const workspaceId = user.workspaceIds?.[0];
    return this.analytics.getOverview(workspaceId);
  }

  @Get("breakdown")
  @Permissions(PERMISSIONS.ANALYTICS_READ)
  @ApiOperation({ summary: "Get industry and distribution breakdowns" })
  @ApiResponse({
    status: 200,
    description: "Workspace breakdown analytics retrieved successfully",
  })
  async getBreakdown(@CurrentUser() user: any) {
    const workspaceId = user.workspaceIds?.[0];
    return this.analytics.getBreakdown(workspaceId);
  }

  @Post("chat")
  @Permissions(PERMISSIONS.ANALYTICS_READ)
  @ApiOperation({ summary: "Natural language query engine for workspace data" })
  @ApiResponse({
    status: 200,
    description: "Analytical insights and suggested queries",
  })
  async chat(
    @CurrentUser() user: any,
    @Body() body: DataChatRequest
  ) {
    const workspaceId = user.workspaceIds?.[0];
    return this.analytics.chat(workspaceId, body.message, body.history);
  }
}
