/**
 * Unit tests for BullMQ worker processors.
 */

import { describe, it, expect, vi } from "vitest";
import { CompanyResearchProcessor } from "./company-research.processor";
import { ContactVerificationProcessor } from "./contact-verification.processor";
import { JobDiscoveryProcessor } from "./job-discovery.processor";

describe("Worker Processors", () => {
  describe("CompanyResearchProcessor", () => {
    it("throws if jobId is missing", async () => {
      const mockRepo = {} as any;
      const processor = new CompanyResearchProcessor(mockRepo);

      await expect(
        processor.process({
          id: "",
          data: { workspaceId: "ws1", companyId: "c1", domain: "example.com" },
        } as any)
      ).rejects.toThrow("Job missing idempotency key");
    });

    it("throws if company is not found in workspace", async () => {
      const mockRepo = {
        findById: vi.fn().mockResolvedValue(null),
      } as any;
      const processor = new CompanyResearchProcessor(mockRepo);

      await expect(
        processor.process({
          id: "job-123",
          data: { workspaceId: "ws1", companyId: "c1", domain: "example.com" },
          updateProgress: vi.fn(),
        } as any)
      ).rejects.toThrow("Company c1 not found in workspace ws1");
    });

    it("enriches company website and returns success", async () => {
      const mockRepo = {
        findById: vi.fn().mockResolvedValue({ _id: "c1", domain: "stripe.com" }),
        updateById: vi.fn().mockResolvedValue({ _id: "c1", industries: ["fintech"] }),
      } as any;
      const processor = new CompanyResearchProcessor(mockRepo);
      const updateProgress = vi.fn();

      const result = await processor.process({
        id: "job-123",
        data: { workspaceId: "ws1", companyId: "c1", domain: "https://stripe.com/" },
        updateProgress,
      } as any);

      expect(result.status).toBe("completed");
      expect(result.domain).toBe("stripe.com");
      expect(result.inferredIndustries).toEqual(["fintech"]);
      expect(mockRepo.updateById).toHaveBeenCalledWith(
        "c1",
        { canonicalWebsite: "https://stripe.com" },
        "ws1"
      );
    });
  });

  describe("ContactVerificationProcessor", () => {
    it("marks valid email as VERIFIED", async () => {
      const mockRepo = {
        findById: vi.fn().mockResolvedValue({ _id: "r1", email: "recruiter@meta.com" }),
        updateById: vi.fn().mockResolvedValue({ _id: "r1" }),
      } as any;
      const processor = new ContactVerificationProcessor(mockRepo);

      const result = await processor.process({
        id: "job-456",
        data: { workspaceId: "ws1", recruiterId: "r1", email: "recruiter@meta.com" },
        updateProgress: vi.fn(),
      } as any);

      expect(result.status).toBe("completed");
      expect(result.verificationState).toBe("VERIFIED");
      expect(mockRepo.updateById).toHaveBeenCalledWith(
        "r1",
        { verificationStatus: "VERIFIED" },
        "ws1"
      );
    });

    it("marks disposable email as RISKY", async () => {
      const mockRepo = {
        findById: vi.fn().mockResolvedValue({ _id: "r1", email: "test@mailinator.com" }),
        updateById: vi.fn().mockResolvedValue({ _id: "r1" }),
      } as any;
      const processor = new ContactVerificationProcessor(mockRepo);

      const result = await processor.process({
        id: "job-457",
        data: { workspaceId: "ws1", recruiterId: "r1", email: "test@mailinator.com" },
        updateProgress: vi.fn(),
      } as any);

      expect(result.status).toBe("completed");
      expect(result.verificationState).toBe("RISKY");
    });

    it("marks malformed email as INVALID", async () => {
      const mockRepo = {
        findById: vi.fn().mockResolvedValue({ _id: "r1", email: "not-an-email" }),
        updateById: vi.fn().mockResolvedValue({ _id: "r1" }),
      } as any;
      const processor = new ContactVerificationProcessor(mockRepo);

      const result = await processor.process({
        id: "job-458",
        data: { workspaceId: "ws1", recruiterId: "r1", email: "not-an-email" },
        updateProgress: vi.fn(),
      } as any);

      expect(result.status).toBe("completed");
      expect(result.verificationState).toBe("INVALID");
    });
  });

  describe("JobDiscoveryProcessor", () => {
    it("runs discovery process and returns completed", async () => {
      const mockRepo = {
        findByCompany: vi.fn().mockResolvedValue([]),
      } as any;
      const processor = new JobDiscoveryProcessor(mockRepo);

      const result = await processor.process({
        id: "job-789",
        data: { workspaceId: "ws1", sourceUrl: "https://careers.stripe.com", companyId: "c1" },
        updateProgress: vi.fn(),
      } as any);

      expect(result.status).toBe("completed");
      expect(result.sourceUrl).toBe("https://careers.stripe.com");
      expect(mockRepo.findByCompany).toHaveBeenCalledWith("c1", "ws1");
    });
  });
});
