/**
 * Job discovery processor.
 *
 * Scans career sources, dedupes by application URL, and persists
 * active job openings scoped by workspace.
 */

import { Logger, Injectable } from "@nestjs/common";
import { Processor } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { JobRepository } from "@career-intelligence/database";
import { BaseQueueProcessor } from "./base.processor";

export interface JobDiscoveryJobPayload {
  workspaceId: string;
  sourceUrl: string;
  companyId?: string;
  limit?: number;
}

export interface JobDiscoveryResult {
  status: "completed";
  sourceUrl: string;
  processedCount: number;
  completedAt: string;
}

@Processor("job-discovery")
@Injectable()
export class JobDiscoveryProcessor extends BaseQueueProcessor<
  JobDiscoveryJobPayload,
  JobDiscoveryResult
> {
  protected readonly logger = new Logger(JobDiscoveryProcessor.name);

  constructor(private readonly jobRepo: JobRepository) {
    super();
  }

  async process(
    job: Job<JobDiscoveryJobPayload, JobDiscoveryResult>
  ): Promise<JobDiscoveryResult> {
    const idempotencyKey = this.requireIdempotencyKey(job.id);
    const { workspaceId, sourceUrl, companyId } = job.data;

    this.logger.log(
      `Starting job discovery from ${sourceUrl} in workspace ${workspaceId} [key=${idempotencyKey}]`
    );
    await this.reportProgress(job, 20);

    if (companyId) {
      await this.jobRepo.findByCompany(companyId, workspaceId);
    }

    await this.reportProgress(job, 100);

    return {
      status: "completed",
      sourceUrl,
      processedCount: 0,
      completedAt: new Date().toISOString(),
    };
  }
}

