/**
 * Unit tests for AnalyticsService.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalyticsService } from "./analytics.service";

describe("AnalyticsService", () => {
  let service: AnalyticsService;
  let mockCompanies: any;
  let mockRecruiters: any;
  let mockJobs: any;

  beforeEach(() => {
    mockCompanies = {
      getMetrics: vi.fn().mockResolvedValue({
        total: 12,
        activeHiring: 5,
        byTier: { TIER_1: 4, TIER_2: 6, TIER_3: 2, UNASSIGNED: 0 },
      }),
      getDailyTrend: vi.fn().mockResolvedValue([
        { _id: new Date().toISOString().split("T")[0], count: 3 },
      ]),
      getIndustryBreakdown: vi.fn().mockResolvedValue([
        { industry: "FinTech", count: 8 },
        { industry: "AI & ML", count: 4 },
      ]),
    };

    mockRecruiters = {
      getMetrics: vi.fn().mockResolvedValue({
        total: 20,
        verified: 15,
        withEmail: 18,
        verificationRate: 75,
        byStatus: { VERIFIED: 15, UNVERIFIED: 5 },
      }),
      getDailyTrend: vi.fn().mockResolvedValue([
        { _id: new Date().toISOString().split("T")[0], count: 5 },
      ]),
    };

    mockJobs = {
      getMetrics: vi.fn().mockResolvedValue({
        total: 8,
        active: 6,
        byWorkMode: { REMOTE: 5, HYBRID: 3 },
        byJobType: { FULL_TIME: 6, CONTRACT: 2 },
      }),
      getDailyTrend: vi.fn().mockResolvedValue([
        { _id: new Date().toISOString().split("T")[0], count: 2 },
      ]),
      getSkillBreakdown: vi.fn().mockResolvedValue([
        { skill: "TypeScript", count: 6 },
        { skill: "Node.js", count: 4 },
      ]),
    };

    service = new AnalyticsService(mockCompanies, mockRecruiters, mockJobs);
  });

  it("computes workspace overview metrics and continuous 7-day trends", async () => {
    const result = await service.getOverview("ws-123");

    expect(result.workspaceId).toBe("ws-123");
    expect(result.companies.total).toBe(12);
    expect(result.companies.activeHiring).toBe(5);
    expect(result.companies.trend.length).toBe(7);

    expect(result.recruiters.total).toBe(20);
    expect(result.recruiters.verified).toBe(15);
    expect(result.recruiters.verificationRate).toBe(75);
    expect(result.recruiters.trend.length).toBe(7);

    expect(result.jobs.total).toBe(8);
    expect(result.jobs.active).toBe(6);
    expect(result.jobs.trend.length).toBe(7);

    expect(result.systemHealth.status).toBe("OPTIMAL");
    expect(result.systemHealth.deliverabilityIndex).toBeGreaterThan(0);
  });

  it("computes workspace breakdown distributions with percentages", async () => {
    const result = await service.getBreakdown("ws-123");

    expect(result.workspaceId).toBe("ws-123");
    expect(result.topIndustries.length).toBe(2);
    expect(result.topIndustries[0]?.industry).toBe("FinTech");
    expect(result.topSkills.length).toBe(2);
    expect(result.topSkills[0]?.skill).toBe("TypeScript");

    expect(result.recruiterVerificationDistribution.length).toBe(2);
    const verifiedItem = result.recruiterVerificationDistribution.find(
      (i) => i.status === "VERIFIED"
    );
    expect(verifiedItem?.percentage).toBe(75);

    expect(result.jobModeDistribution.length).toBe(2);
  });

  it("answers natural language questions with contextual insights and suggestions", async () => {
    const chatResult = await service.chat("ws-123", "How many companies are actively hiring?");

    expect(chatResult.reply).toContain("Company Intelligence Summary");
    expect(chatResult.reply).toContain("**Actively Hiring:** 5");
    expect(chatResult.suggestions.length).toBeGreaterThan(0);
  });
});
