/**
 * Tier 1: Background Queue Processors E2E Tests.
 *
 * Covers:
 * - F16: BullMQ Worker Processors (>=5 tests)
 * - F17: Backend Queue Producers (>=5 tests)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryStateEngine } from "../harness/in-memory-db";
import { CompanyResearchProcessor } from "../../../apps/worker/src/modules/queues/company-research.processor";
import { ContactVerificationProcessor } from "../../../apps/worker/src/modules/queues/contact-verification.processor";
import { JobDiscoveryProcessor } from "../../../apps/worker/src/modules/queues/job-discovery.processor";

describe("Tier 1: Background Queue Processors E2E Suite", () => {
  let stateEngine: InMemoryStateEngine;
  let companyRepo: any;
  let recruiterRepo: any;
  let jobRepo: any;
  const testWsId = "000000000000000000000001";

  beforeEach(() => {
    stateEngine = new InMemoryStateEngine();
    companyRepo = stateEngine.createCompanyRepo();
    recruiterRepo = stateEngine.createRecruiterRepo();
    jobRepo = stateEngine.createJobRepo();
  });

  describe("F16/F17: Company Research Processor", () => {
    it("1. enriches company website, normalizes domain, and updates persistent state", async () => {
      const company = await companyRepo.create({
        workspaceId: testWsId,
        legalName: "Stripe Inc",
        displayName: "Stripe",
        domain: "stripe.com",
        industries: ["fintech"],
      });
      const companyId = company._id.toString();

      const processor = new CompanyResearchProcessor(companyRepo);
      const updateProgress = async () => {};

      const result = await processor.process({
        id: "job-idemp-1",
        data: {
          workspaceId: testWsId,
          companyId,
          domain: "https://stripe.com/",
        },
        updateProgress,
      } as any);

      expect(result.status).toBe("completed");
      expect(result.domain).toBe("stripe.com");
      expect(result.inferredIndustries).toContain("fintech");

      const updatedCompany = await companyRepo.findById(companyId, testWsId);
      expect(updatedCompany.canonicalWebsite).toBe("https://stripe.com");
    });

    it("2. enforces idempotency key requirement and throws if job ID is empty", async () => {
      const processor = new CompanyResearchProcessor(companyRepo);

      await expect(
        processor.process({
          id: "",
          data: { workspaceId: testWsId, companyId: "c1", domain: "example.com" },
        } as any)
      ).rejects.toThrow("Job missing idempotency key");
    });

    it("3. throws descriptive error if company is not found in specified workspace", async () => {
      const processor = new CompanyResearchProcessor(companyRepo);

      await expect(
        processor.process({
          id: "job-idemp-3",
          data: { workspaceId: testWsId, companyId: "000000000000000000000099", domain: "test.com" },
          updateProgress: async () => {},
        } as any)
      ).rejects.toThrow(`not found in workspace ${testWsId}`);
    });
  });

  describe("F16/F17: Contact Verification Processor", () => {
    it("4. verifies valid corporate email address and sets status to VERIFIED", async () => {
      const recruiter = await recruiterRepo.create({
        workspaceId: testWsId,
        name: "Verified Lead",
        email: "lead@google.com",
      });
      const recruiterId = recruiter._id.toString();

      const processor = new ContactVerificationProcessor(recruiterRepo);
      const result = await processor.process({
        id: "job-idemp-4",
        data: {
          workspaceId: testWsId,
          recruiterId,
          email: "lead@google.com",
        },
        updateProgress: async () => {},
      } as any);

      expect(result.status).toBe("completed");
      expect(result.verificationState).toBe("VERIFIED");

      const updated = await recruiterRepo.findById(recruiterId, testWsId);
      expect(updated.verificationStatus).toBe("VERIFIED");
    });

    it("5. identifies disposable email domain and flags verificationStatus as RISKY", async () => {
      const recruiter = await recruiterRepo.create({
        workspaceId: testWsId,
        name: "Risky Lead",
        email: "temp@mailinator.com",
      });
      const recruiterId = recruiter._id.toString();

      const processor = new ContactVerificationProcessor(recruiterRepo);
      const result = await processor.process({
        id: "job-idemp-5",
        data: {
          workspaceId: testWsId,
          recruiterId,
          email: "temp@mailinator.com",
        },
        updateProgress: async () => {},
      } as any);

      expect(result.status).toBe("completed");
      expect(result.verificationState).toBe("RISKY");
    });

    it("6. flags invalid / malformed email format as INVALID", async () => {
      const recruiter = await recruiterRepo.create({
        workspaceId: testWsId,
        name: "Malformed Lead",
        email: "not-an-email-format",
      });
      const recruiterId = recruiter._id.toString();

      const processor = new ContactVerificationProcessor(recruiterRepo);
      const result = await processor.process({
        id: "job-idemp-6",
        data: {
          workspaceId: testWsId,
          recruiterId,
          email: "not-an-email-format",
        },
        updateProgress: async () => {},
      } as any);

      expect(result.status).toBe("completed");
      expect(result.verificationState).toBe("INVALID");
    });
  });

  describe("F16/F17: Job Discovery Processor", () => {
    it("7. executes job discovery for company and reports progress", async () => {
      const processor = new JobDiscoveryProcessor(jobRepo);
      const progressUpdates: number[] = [];
      const updateProgress = async (val: number) => {
        progressUpdates.push(val);
      };

      const result = await processor.process({
        id: "job-idemp-7",
        data: {
          workspaceId: testWsId,
          companyId: "000000000000000000000088",
          sourceUrl: "https://careers.stripe.com",
        },
        updateProgress,
      } as any);

      expect(result.status).toBe("completed");
      expect(result.sourceUrl).toBe("https://careers.stripe.com");
      expect(progressUpdates).toContain(20);
      expect(progressUpdates).toContain(100);
    });
  });
});
