/**
 * Analytics Service.
 *
 * Computes workspace-scoped intelligence metrics, verification ratios,
 * hiring distribution, and multi-day activity trends.
 */

import { Injectable } from "@nestjs/common";
import {
  CompanyRepository,
  RecruiterRepository,
  JobRepository,
} from "@career-intelligence/database";
import type {
  WorkspaceAnalyticsOverview,
  WorkspaceAnalyticsBreakdown,
  TrendDataPoint,
} from "@career-intelligence/shared";

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly companies: CompanyRepository,
    private readonly recruiters: RecruiterRepository,
    private readonly jobs: JobRepository
  ) {}

  private buildContinuousDateRange(
    rawTrends: Array<{ _id: string; count: number }>,
    days: number = 7
  ): TrendDataPoint[] {
    const trendMap = new Map<string, number>();
    for (const item of rawTrends) {
      if (item._id) {
        trendMap.set(item._id, item.count);
      }
    }

    const result: TrendDataPoint[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0] || "";
      result.push({
        date: dateStr,
        count: trendMap.get(dateStr) || 0,
      });
    }

    return result;
  }

  async getOverview(workspaceId: string): Promise<WorkspaceAnalyticsOverview> {
    const [
      companyMetrics,
      companyTrendRaw,
      recruiterMetrics,
      recruiterTrendRaw,
      jobMetrics,
      jobTrendRaw,
    ] = await Promise.all([
      this.companies.getMetrics(workspaceId),
      this.companies.getDailyTrend(workspaceId, 7),
      this.recruiters.getMetrics(workspaceId),
      this.recruiters.getDailyTrend(workspaceId, 7),
      this.jobs.getMetrics(workspaceId),
      this.jobs.getDailyTrend(workspaceId, 7),
    ]);

    const companyTrend = this.buildContinuousDateRange(companyTrendRaw, 7);
    const recruiterTrend = this.buildContinuousDateRange(recruiterTrendRaw, 7);
    const jobTrend = this.buildContinuousDateRange(jobTrendRaw, 7);

    // Compute composite deliverability index (0-100)
    let deliverabilityIndex = 85;
    if (recruiterMetrics.total > 0) {
      deliverabilityIndex = Math.min(
        100,
        Math.max(50, Math.round(recruiterMetrics.verificationRate * 0.7 + 30))
      );
    }

    return {
      workspaceId,
      companies: {
        total: companyMetrics.total,
        activeHiring: companyMetrics.activeHiring,
        byTier: companyMetrics.byTier,
        trend: companyTrend,
      },
      recruiters: {
        total: recruiterMetrics.total,
        verified: recruiterMetrics.verified,
        withEmail: recruiterMetrics.withEmail,
        verificationRate: recruiterMetrics.verificationRate,
        byStatus: recruiterMetrics.byStatus,
        trend: recruiterTrend,
      },
      jobs: {
        total: jobMetrics.total,
        active: jobMetrics.active,
        byWorkMode: jobMetrics.byWorkMode,
        byJobType: jobMetrics.byJobType,
        trend: jobTrend,
      },
      systemHealth: {
        status: deliverabilityIndex >= 80 ? "OPTIMAL" : "OPERATIONAL",
        deliverabilityIndex,
        lastSynchronizedAt: new Date().toISOString(),
      },
    };
  }

  async getBreakdown(workspaceId: string): Promise<WorkspaceAnalyticsBreakdown> {
    const [topIndustries, recruiterMetrics, jobMetrics] = await Promise.all([
      this.companies.getIndustryBreakdown(workspaceId, 8),
      this.recruiters.getMetrics(workspaceId),
      this.jobs.getMetrics(workspaceId),
    ]);

    const recTotal = recruiterMetrics.total || 1;
    const recruiterVerificationDistribution = Object.entries(
      recruiterMetrics.byStatus
    ).map(([status, count]) => ({
      status,
      count,
      percentage: Math.round((count / recTotal) * 1000) / 10,
    }));

    const jobTotal = jobMetrics.total || 1;
    const jobModeDistribution = Object.entries(jobMetrics.byWorkMode).map(
      ([mode, count]) => ({
        mode,
        count,
        percentage: Math.round((count / jobTotal) * 1000) / 10,
      })
    );

    return {
      workspaceId,
      topIndustries: topIndustries || [],
      recruiterVerificationDistribution,
      jobModeDistribution,
    };
  }
}
