/**
 * Queue processor registry.
 *
 * Registers all BullMQ queue processors. Each processor handles a specific
 * queue from the central registry.
 */

import { Module } from "@nestjs/common";
import { CompanyResearchProcessor } from "./company-research.processor";
import { ContactVerificationProcessor } from "./contact-verification.processor";
import { JobDiscoveryProcessor } from "./job-discovery.processor";

@Module({
  providers: [
    CompanyResearchProcessor,
    ContactVerificationProcessor,
    JobDiscoveryProcessor,
  ],
  exports: [
    CompanyResearchProcessor,
    ContactVerificationProcessor,
    JobDiscoveryProcessor,
  ],
})
export class QueueProcessorsModule {}
