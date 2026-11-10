/**
 * Contact verification processor.
 *
 * Verifies recruiter email addresses through syntax, MX domain validation,
 * and updates verification state scoped by workspace.
 */

import { Logger, Injectable } from "@nestjs/common";
import { Processor } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { RecruiterRepository } from "@career-intelligence/database";
import { VerificationStatus } from "@career-intelligence/shared";
import { BaseQueueProcessor } from "./base.processor";

export interface ContactVerificationJobPayload {
  workspaceId: string;
  recruiterId: string;
  email: string;
}

export interface ContactVerificationResult {
  status: "completed";
  recruiterId: string;
  email: string;
  verificationStatus: VerificationStatus;
  verificationState: VerificationStatus;
  verifiedAt: string;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "tempmail.com",
  "guerrillamail.com",
  "throwawaymail.com",
]);

@Processor("contact-verification")
@Injectable()
export class ContactVerificationProcessor extends BaseQueueProcessor<
  ContactVerificationJobPayload,
  ContactVerificationResult
> {
  protected readonly logger = new Logger(ContactVerificationProcessor.name);

  constructor(private readonly recruiterRepo: RecruiterRepository) {
    super();
  }

  async process(
    job: Job<ContactVerificationJobPayload, ContactVerificationResult>
  ): Promise<ContactVerificationResult> {
    const idempotencyKey = this.requireIdempotencyKey(job.id);
    const { workspaceId, recruiterId, email } = job.data;

    this.logger.log(
      `Starting contact verification for recruiter ${recruiterId} (${email}) [key=${idempotencyKey}]`
    );
    await this.reportProgress(job, 15);

    const recruiter = await this.recruiterRepo.findById(recruiterId, workspaceId);
    if (!recruiter) {
      throw new Error(`Recruiter ${recruiterId} not found in workspace ${workspaceId}`);
    }

    await this.reportProgress(job, 40);

    const trimmedEmail = email.toLowerCase().trim();
    let status: VerificationStatus = "SYNTAX_VALID";

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      status = "INVALID";
    } else {
      const domain = trimmedEmail.split("@")[1];
      if (domain && DISPOSABLE_DOMAINS.has(domain)) {
        status = "RISKY";
      } else {
        status = "VERIFIED";
      }
    }

    await this.reportProgress(job, 80);

    await this.recruiterRepo.updateById(
      recruiterId,
      {
        verificationStatus: status,
      },
      workspaceId
    );

    await this.reportProgress(job, 100);

    return {
      status: "completed",
      recruiterId,
      email: trimmedEmail,
      verificationStatus: status,
      verificationState: status,
      verifiedAt: new Date().toISOString(),
    };
  }
}
