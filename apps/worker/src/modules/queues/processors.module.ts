/**
 * Queue processor registry.
 *
 * Registers all BullMQ queue processors. Each processor handles a specific
 * queue from the central registry. Processors are added here as they are
 * implemented.
 */

import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { QUEUE_NAMES } from "../../config/queues";

// Example processor skeleton — uncomment and implement when workload is ready:
// @Processor(QUEUE_NAMES[0])
// export class CompanyResearchProcessor extends BaseQueueProcessor {
//   protected readonly logger = new Logger(CompanyResearchProcessor.name);
//
//   async process(job: Job<any>) {
//     const idempotencyKey = this.requireIdempotencyKey(job.id);
//     // ... implement research logic
//     return { status: "completed", idempotencyKey };
//   }
// }

@Module({
  imports: [BullModule.registerQueue(...QUEUE_NAMES.map((name) => ({ name })))],
  providers: [],
  exports: [BullModule],
})
export class QueueProcessorsModule {}
