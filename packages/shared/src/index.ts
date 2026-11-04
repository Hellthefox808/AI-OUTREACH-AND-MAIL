/**
 * Shared domain types, constants and schemas for Career Intelligence OS.
 *
 * All types are workspace-scoped. Every entity carries `workspaceId` so that
 * data isolation is enforced at the type level and in repository queries.
 */

import { z } from 'zod';

/* ------------------------------------------------------------------ */
/*  Branded primitive IDs                                             */
/* ------------------------------------------------------------------ */

export type Brand<K, T> = K & { __brand: T };

export type WorkspaceId = Brand<string, 'WorkspaceId'>;
export type UserId = Brand<string, 'UserId'>;
export type CompanyId = Brand<string, 'CompanyId'>;
export type RecruiterId = Brand<string, 'RecruiterId'>;
export type JobId = Brand<string, 'JobId'>;
export type CampaignId = Brand<string, 'CampaignId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type ResearchId = Brand<string, 'ResearchId'>;
export type JobIdString = Brand<string, 'JobIdString'>;

export function id<T>(value: string): Brand<string, T> {
  return value as Brand<string, T>;
}

/* ------------------------------------------------------------------ */
/*  Timestamps                                                        */
/* ------------------------------------------------------------------ */

export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletable {
  deletedAt: Date | null;
}

/* ------------------------------------------------------------------ */
/*  Workspace-scoped base entity                                      */
/* ------------------------------------------------------------------ */

export interface BaseEntity extends Timestamped, SoftDeletable {
  _id: string;
  workspaceId: WorkspaceId;
}

/* ------------------------------------------------------------------ */
/*  Verification states                                               */
/* ------------------------------------------------------------------ */

export const VERIFICATION_STATES = [
  'PUBLISHED',
  'INFERRED',
  'SYNTAX_VALID',
  'DOMAIN_VALID',
  'MX_AVAILABLE',
  'PROVIDER_CHECKED',
  'VERIFIED',
  'UNVERIFIED',
  'RISKY',
  'CATCH_ALL',
  'INVALID',
  'SUPPRESSED',
] as const;

export type VerificationState = (typeof VERIFICATION_STATES)[number];

export const VerificationStateSchema = z.enum(VERIFICATION_STATES);

/* ------------------------------------------------------------------ */
/*  Company tier                                                      */
/* ------------------------------------------------------------------ */

export const COMPANY_TIERS = ['TIER_1', 'TIER_2', 'TIER_3'] as const;

export type CompanyTier = (typeof COMPANY_TIERS)[number];

export const CompanyTierSchema = z.enum(COMPANY_TIERS);

/* ------------------------------------------------------------------ */
/*  Industry                                                          */
/* ------------------------------------------------------------------ */

export const INDUSTRIES = [
  'software_engineering',
  'saas',
  'ai_ml',
  'generative_ai',
  'ai_agents',
  'data_science',
  'data_engineering',
  'cloud_computing',
  'devops_sre',
  'platform_engineering',
  'cybersecurity',
  'networking',
  'telecommunications',
  'fintech',
  'banking_technology',
  'health_technology',
  'product_engineering',
  'hardware',
  'semiconductor',
  'embedded_systems',
  'industrial_iot',
  'it_consulting',
  'it_enabled_services',
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export const IndustrySchema = z.enum(INDUSTRIES);

/* ------------------------------------------------------------------ */
/*  Employment / job types                                            */
/* ------------------------------------------------------------------ */

export const JOB_TYPES = [
  'full_time',
  'part_time',
  'contract',
  'internship',
  'graduate',
  'temporary',
] as const;

export type JobType = (typeof JOB_TYPES)[number];

export const WORK_MODES = ['remote', 'hybrid', 'on_site'] as const;

export type WorkMode = (typeof WORK_MODES)[number];

/* ------------------------------------------------------------------ */
/*  Campaign / sequence states                                        */
/* ------------------------------------------------------------------ */

export const SEQUENCE_STATES = [
  'DRAFT',
  'AWAITING_APPROVAL',
  'APPROVED',
  'ACTIVE',
  'PAUSED',
  'REPLIED',
  'BOUNCED',
  'UNSUBSCRIBED',
  'DO_NOT_CONTACT',
  'CANCELLED',
  'COMPLETED',
  'FAILED_REVIEW',
] as const;

export type SequenceState = (typeof SEQUENCE_STATES)[number];

export const SequenceStateSchema = z.enum(SEQUENCE_STATES);

/* ------------------------------------------------------------------ */
/*  Reply classifications                                             */
/* ------------------------------------------------------------------ */

export const REPLY_CLASSIFICATIONS = [
  'INTERESTED',
  'INTERVIEW',
  'ASSESSMENT',
  'REFERRAL',
  'INFORMATION_REQUESTED',
  'REJECTED',
  'NOT_HIRING',
  'OUT_OF_OFFICE',
  'OTHER',
] as const;

export type ReplyClassification = (typeof REPLY_CLASSIFICATIONS)[number];

export const ReplyClassificationSchema = z.enum(REPLY_CLASSIFICATIONS);

/* ------------------------------------------------------------------ */
/*  Pagination                                                        */
/* ------------------------------------------------------------------ */

export interface PaginationInput {
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/* ------------------------------------------------------------------ */
/*  Permissions                                                       */
/* ------------------------------------------------------------------ */

export const PERMISSIONS = {
  // Auth
  AUTH_LOGIN: "auth:login",
  AUTH_LOGOUT: "auth:logout",
  AUTH_MANAGE_USERS: "auth:manage_users",

  // Workspaces
  WORKSPACE_READ: "workspace:read",
  WORKSPACE_WRITE: "workspace:write",
  WORKSPACE_MANAGE_MEMBERS: "workspace:manage_members",

  // Companies
  COMPANY_READ: "company:read",
  COMPANY_WRITE: "company:write",
  COMPANY_RESEARCH: "company:research",

  // Recruiters
  RECRUITER_READ: "recruiter:read",
  RECRUITER_WRITE: "recruiter:write",
  RECRUITER_DISCOVER: "recruiter:discover",

  // Jobs
  JOB_READ: "job:read",
  JOB_WRITE: "job:write",
  JOB_DISCOVER: "job:discover",

  // Candidates
  CANDIDATE_READ: "candidate:read",
  CANDIDATE_WRITE: "candidate:write",

  // Resumes
  RESUME_READ: "resume:read",
  RESUME_WRITE: "resume:write",

  // Content
  CONTENT_READ: "content:read",
  CONTENT_WRITE: "content:write",
  CONTENT_APPROVE: "content:approve",

  // Campaigns
  CAMPAIGN_READ: "campaign:read",
  CAMPAIGN_WRITE: "campaign:write",
  CAMPAIGN_SEND: "campaign:send",

  // Mailboxes
  MAILBOX_READ: "mailbox:read",
  MAILBOX_WRITE: "mailbox:write",
  MAILBOX_SYNC: "mailbox:sync",

  // Research
  RESEARCH_READ: "research:read",
  RESEARCH_WRITE: "research:write",

  // Verification
  VERIFICATION_READ: "verification:read",
  VERIFICATION_WRITE: "verification:write",

  // Analytics
  ANALYTICS_READ: "analytics:read",

  // Admin
  ADMIN_AUDIT: "admin:audit",
  ADMIN_SETTINGS: "admin:settings",
  ADMIN_SYSTEM: "admin:system",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/* ------------------------------------------------------------------ */
/*  Roles                                                             */
/* ------------------------------------------------------------------ */

export const ROLES = {
  ADMIN: "admin",
  MEMBER: "member",
  VIEWER: "viewer",
} as const;

export type RoleKey = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MEMBER]: [
    PERMISSIONS.AUTH_LOGIN,
    PERMISSIONS.AUTH_LOGOUT,
    PERMISSIONS.WORKSPACE_READ,
    PERMISSIONS.WORKSPACE_WRITE,
    PERMISSIONS.COMPANY_READ,
    PERMISSIONS.COMPANY_WRITE,
    PERMISSIONS.COMPANY_RESEARCH,
    PERMISSIONS.RECRUITER_READ,
    PERMISSIONS.RECRUITER_WRITE,
    PERMISSIONS.RECRUITER_DISCOVER,
    PERMISSIONS.JOB_READ,
    PERMISSIONS.JOB_WRITE,
    PERMISSIONS.JOB_DISCOVER,
    PERMISSIONS.CANDIDATE_READ,
    PERMISSIONS.CANDIDATE_WRITE,
    PERMISSIONS.RESUME_READ,
    PERMISSIONS.RESUME_WRITE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_WRITE,
    PERMISSIONS.CAMPAIGN_READ,
    PERMISSIONS.CAMPAIGN_WRITE,
    PERMISSIONS.CAMPAIGN_SEND,
    PERMISSIONS.MAILBOX_READ,
    PERMISSIONS.MAILBOX_WRITE,
    PERMISSIONS.MAILBOX_SYNC,
    PERMISSIONS.RESEARCH_READ,
    PERMISSIONS.RESEARCH_WRITE,
    PERMISSIONS.VERIFICATION_READ,
    PERMISSIONS.VERIFICATION_WRITE,
    PERMISSIONS.ANALYTICS_READ,
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.AUTH_LOGIN,
    PERMISSIONS.AUTH_LOGOUT,
    PERMISSIONS.WORKSPACE_READ,
    PERMISSIONS.COMPANY_READ,
    PERMISSIONS.RECRUITER_READ,
    PERMISSIONS.JOB_READ,
    PERMISSIONS.CANDIDATE_READ,
    PERMISSIONS.RESUME_READ,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CAMPAIGN_READ,
    PERMISSIONS.MAILBOX_READ,
    PERMISSIONS.RESEARCH_READ,
    PERMISSIONS.VERIFICATION_READ,
    PERMISSIONS.ANALYTICS_READ,
  ],
} as const;

/* ------------------------------------------------------------------ */
/*  Email provider                                                    */
/* ------------------------------------------------------------------ */

export const EMAIL_PROVIDERS = ['gmail', 'microsoft'] as const;

export type EmailProvider = (typeof EMAIL_PROVIDERS)[number];

export const EmailProviderSchema = z.enum(EMAIL_PROVIDERS);

/* ------------------------------------------------------------------ */
/*  OAuth scopes                                                      */
/* ------------------------------------------------------------------ */

export const GMAIL_SCOPES = {
  send: 'https://www.googleapis.com/auth/gmail.send',
  readonly: 'https://www.googleapis.com/auth/gmail.readonly',
  metadata: 'https://www.googleapis.com/auth/gmail.metadata',
} as const;

/* ------------------------------------------------------------------ */
/*  Common Zod object id                                              */
/* ------------------------------------------------------------------ */

export const ObjectIdSchema = z.string().min(1);

/* ------------------------------------------------------------------ */
/*  Errors                                                            */
/* ------------------------------------------------------------------ */

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', 404, `${resource} not found: ${id}`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', 401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', 403, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super('CONFLICT', 409, message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', 400, message, details);
  }
}
