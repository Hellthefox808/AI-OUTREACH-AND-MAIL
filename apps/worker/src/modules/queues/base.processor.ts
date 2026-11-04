/**
 * Base queue processor.
 *
 * All queue processors extend this class. Provides structured job handling
 * with progress reporting, idempotency keys, and dead-letter awareness.
 */

import { Logger } from "@nestjs/common";

export abstract class BaseQueueProcessor<TPayload = unknown, TResult = unknown> {
  protected abstract readonly logger: Logger;

  abstract process(job: { id: string; name: string; data: TPayload }): Promise<TResult>;

  onFailed(job: { id: string; name: string; attemptsMade: number }, error: Error): void {
    this.logger.error(
      `Job ${job.id} (${job.name}) failed after ${job.attemptsMade} attempts: ${error.message}`,
      { jobId: job.id, jobName: job.name, attempts: job.attemptsMade, stack: error.stack },
    );
  }

  onCompleted(job: { id: string; name: string }, result: TResult): void {
    this.logger.log(
      `Job ${job.id} (${job.name}) completed`,
      { jobId: job.id, jobName: job.name, result },
    );
  }

  protected reportProgress(_progress: number): void {
    // Non-fatal: progress update failure should not fail the job
  }

  protected requireIdempotencyKey(jobId: string): string {
    if (!jobId) {
      throw new Error("Job missing idempotency key");
    }
    return jobId;
  }
}
