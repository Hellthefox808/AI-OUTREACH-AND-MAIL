/**
 * Queue registry — centralized definition of all BullMQ queues.
 *
 * Each queue defines its concurrency, rate limits, retry policy, and
 * dead-letter settings. Processors register against these queue names.
 */

export const QUEUE_NAMES = [
  "company-research",
  "company-enrichment",
  "recruiter-discovery",
  "contact-verification",
  "job-discovery",
  "event-discovery",
  "resume-processing",
  "ai-generation",
  "email-draft",
  "email-dispatch",
  "mailbox-sync",
  "reply-classification",
  "analytics",
  "maintenance",
] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];

export interface QueueOptions {
  concurrency?: number;
  rateLimit?: number; // jobs per second
  defaultJobOptions?: {
    attempts?: number;
    backoff?: { type: "fixed" | "exponential"; delay: number };
    ttl?: number;
  };
  removeOnComplete?: number;
  removeOnFail?: number;
}

export const QUEUE_DEFINITIONS: Record<QueueName, QueueOptions> = {
  "company-research": {
    concurrency: 2,
    rateLimit: 1,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
  "company-enrichment": {
    concurrency: 2,
    rateLimit: 1,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
  "recruiter-discovery": {
    concurrency: 2,
    rateLimit: 1,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
  "contact-verification": {
    concurrency: 3,
    rateLimit: 2,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 3000 },
    },
    removeOnComplete: 200,
    removeOnFail: 100,
  },
  "job-discovery": {
    concurrency: 2,
    rateLimit: 1,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
  "event-discovery": {
    concurrency: 2,
    rateLimit: 1,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
  "resume-processing": {
    concurrency: 1,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "fixed", delay: 5000 },
    },
    removeOnComplete: 50,
    removeOnFail: 25,
  },
  "ai-generation": {
    concurrency: 1,
    rateLimit: 1,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "exponential", delay: 5000 },
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
  "email-draft": {
    concurrency: 2,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 3000 },
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
  "email-dispatch": {
    concurrency: 1,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 60000 },
    },
    removeOnComplete: 200,
    removeOnFail: 100,
  },
  "mailbox-sync": {
    concurrency: 1,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 30000 },
    },
    removeOnComplete: 50,
    removeOnFail: 25,
  },
  "reply-classification": {
    concurrency: 2,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "fixed", delay: 2000 },
    },
    removeOnComplete: 200,
    removeOnFail: 100,
  },
  "analytics": {
    concurrency: 1,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: "fixed", delay: 10000 },
    },
    removeOnComplete: 50,
    removeOnFail: 25,
  },
  "maintenance": {
    concurrency: 1,
    defaultJobOptions: {
      attempts: 1,
      backoff: { type: "fixed", delay: 0 },
    },
    removeOnComplete: 10,
    removeOnFail: 5,
  },
};
