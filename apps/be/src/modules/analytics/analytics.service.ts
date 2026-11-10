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

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class AnalyticsService {
  private static readonly overviewCache = new Map<string, CacheEntry<WorkspaceAnalyticsOverview>>();
  private static readonly breakdownCache = new Map<string, CacheEntry<WorkspaceAnalyticsBreakdown>>();
  private static readonly CACHE_TTL_MS = 15_000; // 15s TTL for high-throughput dashboard hits

  public static clearCache(): void {
    AnalyticsService.overviewCache.clear();
    AnalyticsService.breakdownCache.clear();
  }

  public static invalidate(workspaceId: string): void {
    AnalyticsService.overviewCache.delete(workspaceId);
    AnalyticsService.breakdownCache.delete(workspaceId);
  }

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
    const cached = AnalyticsService.overviewCache.get(workspaceId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

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

    const result: WorkspaceAnalyticsOverview = {
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

    AnalyticsService.overviewCache.set(workspaceId, {
      data: result,
      expiresAt: Date.now() + AnalyticsService.CACHE_TTL_MS,
    });

    return result;
  }

  async getBreakdown(workspaceId: string): Promise<WorkspaceAnalyticsBreakdown> {
    const cached = AnalyticsService.breakdownCache.get(workspaceId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const [topIndustries, topSkills, recruiterMetrics, jobMetrics] = await Promise.all([
      this.companies.getIndustryBreakdown(workspaceId, 8),
      this.jobs.getSkillBreakdown(workspaceId, 8),
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

    const result: WorkspaceAnalyticsBreakdown = {
      workspaceId,
      topIndustries: topIndustries || [],
      topSkills: topSkills || [],
      recruiterVerificationDistribution,
      jobModeDistribution,
    };

    AnalyticsService.breakdownCache.set(workspaceId, {
      data: result,
      expiresAt: Date.now() + AnalyticsService.CACHE_TTL_MS,
    });

    return result;
  }

  async chat(
    workspaceId: string,
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _history?: Array<{ role: "user" | "model"; content: string }>
  ) {
    const [overview, breakdown] = await Promise.all([
      this.getOverview(workspaceId),
      this.getBreakdown(workspaceId),
    ]);

    const lower = message.toLowerCase();
    let reply = "";
    let thoughts = "";
    let suggestions: string[] = [];

    if (lower.includes("hiring") || lower.includes("company") || lower.includes("companies")) {
      thoughts = "Evaluated company directory and tier distributions within workspace.";
      reply = `### Company Intelligence Summary
- **Total Tracked Companies:** ${overview.companies.total}
- **Actively Hiring:** ${overview.companies.activeHiring} (${overview.companies.total > 0 ? Math.round((overview.companies.activeHiring / overview.companies.total) * 100) : 0}%)
- **Tier 1 Strategic Accounts:** ${overview.companies.byTier.TIER_1}
- **Tier 2 High-Growth Accounts:** ${overview.companies.byTier.TIER_2}
- **Tier 3 Indexed Accounts:** ${overview.companies.byTier.TIER_3}

**Top Hiring Sectors:** ${
        breakdown.topIndustries.length > 0
          ? breakdown.topIndustries.map((i) => `${i.industry} (${i.count})`).join(", ")
          : "None categorized yet"
      }`;
      suggestions = [
        "What is our recruiter verification rate?",
        "Show remote job opportunities",
        "Which skills are in highest demand?",
      ];
    } else if (lower.includes("recruiter") || lower.includes("email") || lower.includes("deliverability") || lower.includes("verify")) {
      thoughts = "Queried talent acquisition lead deliverability and verification status distribution.";
      reply = `### Recruiter Reach & Verification Matrix
- **Total Recruiter Contacts:** ${overview.recruiters.total}
- **Deliverability-Verified Emails:** ${overview.recruiters.verified}
- **Verification Rate:** **${overview.recruiters.verificationRate}%**
- **Composite Deliverability Health Index:** **${overview.systemHealth.deliverabilityIndex}% (${overview.systemHealth.status})**

**Deliverability Status Breakdown:**
${breakdown.recruiterVerificationDistribution
  .map((s) => `- \`${s.status}\`: ${s.count} contacts (${s.percentage}%)`)
  .join("\n")}`;
      suggestions = [
        "How many companies are actively hiring?",
        "Export verified recruiters to CSV",
        "View active career requisitions",
      ];
    } else if (lower.includes("job") || lower.includes("remote") || lower.includes("skill") || lower.includes("opening")) {
      thoughts = "Analyzed open requisitions, work mode split, and required skill frequencies.";
      reply = `### Opportunity & Skill Intelligence
- **Total Career Requisitions:** ${overview.jobs.total}
- **Active Openings:** ${overview.jobs.active}
- **Work Mode Distribution:**
  - Remote: ${overview.jobs.byWorkMode["REMOTE"] || 0}
  - Hybrid: ${overview.jobs.byWorkMode["HYBRID"] || 0}
  - Onsite: ${overview.jobs.byWorkMode["ONSITE"] || 0}

**Top In-Demand Skills:**
${
  breakdown.topSkills.length > 0
    ? breakdown.topSkills.map((s) => `- **${s.skill}**: required in ${s.count} postings`).join("\n")
    : "No skill tags detected in current postings."
}`;
      suggestions = [
        "Summarize company hiring activity",
        "What is our deliverability health index?",
        "Filter for remote full-time positions",
      ];
    } else {
      thoughts = "Synthesized broad executive overview across talent, companies, and open positions.";
      reply = `### Executive Career Intelligence Overview
- **Tracked Accounts:** ${overview.companies.total} (${overview.companies.activeHiring} actively hiring)
- **Recruiter Contacts:** ${overview.recruiters.total} (${overview.recruiters.verificationRate}% verified)
- **Active Positions:** ${overview.jobs.active}
- **Deliverability Health:** ${overview.systemHealth.deliverabilityIndex}% (${overview.systemHealth.status})

Select a quick action below to drill deeper into the workspace dataset.`;
      suggestions = [
        "How many companies are hiring?",
        "What is our recruiter verification rate?",
        "Show in-demand skills and remote jobs",
      ];
    }

    return {
      reply,
      thoughts,
      suggestions,
    };
  }
}
