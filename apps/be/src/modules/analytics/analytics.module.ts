/**
 * Analytics Module.
 *
 * Provides workspace-level data analytics and aggregations for Career Intelligence OS.
 */

import { Module } from "@nestjs/common";
import { DatabaseModule } from "@career-intelligence/database";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsController } from "./analytics.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
