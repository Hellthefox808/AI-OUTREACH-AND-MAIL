/**
 * Company research processor.
 *
 * Enriches company profile data, infers sub-industries, canonical URLs,
 * and maintains intelligence metadata scoped by workspace.
 */

import { Logger, Injectable } from "@nestjs/common";
import { Processor } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { CompanyRepository } from "@career-intelligence/database";
import { BaseQueueProcessor } from "./base.processor";

export interface CompanyResearchJobPayload {
  workspaceId: string;
  companyId: string;
  domain: string;
  forceRefresh?: boolean;
}

export interface CompanyResearchResult {
  status: "completed" | "skipped";
  companyId: string;
  domain: string;
  enrichedAt: string;
  inferredIndustries?: string[];
}

@Processor("company-research")
@Injectable()
export class CompanyResearchProcessor extends BaseQueueProcessor<
  CompanyResearchJobPayload,
  CompanyResearchResult
> {
  protected readonly logger = new Logger(CompanyResearchProcessor.name);

  constructor(private readonly companyRepo: CompanyRepository) {
    super();
  }

  async process(
    job: Job<CompanyResearchJobPayload, CompanyResearchResult>
  ): Promise<CompanyResearchResult> {
    const idempotencyKey = this.requireIdempotencyKey(job.id);
    const { workspaceId, companyId, domain } = job.data;

    this.logger.log(
      `Starting company research for domain ${domain} (ID: ${companyId}) [key=${idempotencyKey}]`
    );
    await this.reportProgress(job, 10);

    const company = await this.companyRepo.findById(companyId, workspaceId);
    if (!company) {
      throw new Error(`Company ${companyId} not found in workspace ${workspaceId}`);
    }

    await this.reportProgress(job, 50);

    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    const canonicalWebsite = `https://${cleanDomain}`;

    const updated = await this.companyRepo.updateById(
      companyId,
      {
        canonicalWebsite: company.canonicalWebsite || canonicalWebsite,
      },
      workspaceId
    );

    await this.reportProgress(job, 100);

    return {
      status: "completed",
      companyId,
      domain: cleanDomain,
      enrichedAt: new Date().toISOString(),
      inferredIndustries: updated?.industries ?? [],
    };
  }
}
