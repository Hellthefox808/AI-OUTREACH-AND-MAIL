/**
 * Base queue processor.
 *
 * All queue processors extend this class. Provides structured job handling
 * with progress reporting, idempotency keys, and dead-letter awareness.
 */

import { Logger } from "@nestjs/common";
import { WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

export abstract class BaseQueueProcessor<TPayload = unknown, TResult = unknown> extends WorkerHost {
  protected abstract readonly logger: Logger;

  abstract override process(job: Job<TPayload, TResult>): Promise<TResult>;

  onFailed(job: { id?: string; name: string; attemptsMade?: number }, error: Error): void {
    this.logger.error(
      `Job ${job.id ?? "unknown"} (${job.name}) failed after ${job.attemptsMade ?? 0} attempts: ${error.message}`,
      { jobId: job.id, jobName: job.name, attempts: job.attemptsMade, stack: error.stack },
    );
  }

  onCompleted(job: { id?: string; name: string }, result: TResult): void {
    this.logger.log(
      `Job ${job.id ?? "unknown"} (${job.name}) completed`,
      { jobId: job.id, jobName: job.name, result },
    );
  }

  protected async reportProgress(job: Job<TPayload, TResult>, progress: number): Promise<void> {
    try {
      await job.updateProgress(progress);
    } catch {
      // Non-fatal: progress update failure should not fail the job
    }
  }

  protected requireIdempotencyKey(jobId?: string): string {
    if (!jobId) {
      throw new Error("Job missing idempotency key");
    }
    return jobId;
  }
}
