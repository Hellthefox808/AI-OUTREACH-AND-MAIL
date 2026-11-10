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
/*  Verification statuses / states                                    */
/* ------------------------------------------------------------------ */

export const VERIFICATION_STATUSES = [
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

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export const VerificationStatusSchema = z.enum(VERIFICATION_STATUSES);

// Backward-compatibility aliases
export const VERIFICATION_STATES = VERIFICATION_STATUSES;
export type VerificationState = VerificationStatus;
export const VerificationStateSchema = VerificationStatusSchema;

export const COMPANY_VERIFICATION_STATUSES = [
  'PUBLISHED',
  'VERIFIED',
  'UNVERIFIED',
  'INVALID',
] as const;

export type CompanyVerificationStatus = (typeof COMPANY_VERIFICATION_STATUSES)[number];
export const CompanyVerificationStatusSchema = z.enum(COMPANY_VERIFICATION_STATUSES);

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
export const JobTypeSchema = z.enum(JOB_TYPES);

export const WORK_MODES = ['remote', 'hybrid', 'on_site'] as const;

export type WorkMode = (typeof WORK_MODES)[number];
export const WorkModeSchema = z.enum(WORK_MODES);

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

export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  cursor: z.string().optional(),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginationInputSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
});

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
  limit?: number;
  offset?: number;
}

export function createPaginatedResultSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable().optional(),
    hasMore: z.boolean(),
    total: z.number().optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
  });
}

export const PaginatedResultSchema = createPaginatedResultSchema(z.unknown());
export type PaginatedResultDto = z.infer<typeof PaginatedResultSchema>;

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
/*  Company DTO Schemas                                               */
/* ------------------------------------------------------------------ */

export const CreateCompanySchema = z.object({
  legalName: z.string().min(1, 'Legal name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  domain: z.string().min(1, 'Domain is required'),
  canonicalWebsite: z.string().url().optional().or(z.literal('')),
  headquarters: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  industries: z.array(z.string()).default([]),
  subIndustries: z.array(z.string()).default([]),
  operatingLocations: z.array(z.string()).default([]),
  technologyCategories: z.array(z.string()).default([]),
  tier: CompanyTierSchema.optional(),
  classificationRationale: z.string().optional(),
  companySize: z.string().optional(),
  careerPage: z.string().url().optional().or(z.literal('')),
  officialHiringPage: z.string().url().optional().or(z.literal('')),
  hiringActivity: z.boolean().default(false),
  activeJobOpenings: z.number().int().min(0).default(0),
  parentOrganization: z.string().optional(),
  verificationStatus: CompanyVerificationStatusSchema.default('UNVERIFIED'),
});

export const UpdateCompanySchema = CreateCompanySchema.partial();

export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;

/* ------------------------------------------------------------------ */
/*  Recruiter DTO Schemas                                             */
/* ------------------------------------------------------------------ */

export const CreateRecruiterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  companyId: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email().optional(),
  profileUrl: z.string().url().optional().or(z.literal('')),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  discoveryMethod: z.string().optional(),
  confidence: z.number().min(0).max(100).optional(),
  contactRelevance: z.string().optional(),
  notes: z.string().optional(),
  verificationStatus: VerificationStatusSchema.default('UNVERIFIED'),
});

export const UpdateRecruiterSchema = CreateRecruiterSchema.partial();

export type CreateRecruiterInput = z.infer<typeof CreateRecruiterSchema>;
export type UpdateRecruiterInput = z.infer<typeof UpdateRecruiterSchema>;

/* ------------------------------------------------------------------ */
/*  Job Posting DTO Schemas                                           */
/* ------------------------------------------------------------------ */

export const CreateJobPostingSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  companyId: z.string().optional(),
  description: z.string().optional(),
  type: JobTypeSchema,
  workMode: WorkModeSchema,
  location: z.string().optional(),
  requiredSkills: z.array(z.string()).default([]),
  experienceRequirement: z.string().optional(),
  salaryMin: z.number().min(0, 'salaryMin must be non-negative').optional(),
  salaryMax: z.number().min(0, 'salaryMax must be non-negative').optional(),
  salaryCurrency: z.string().optional(),
  applicationUrl: z.string().url('Application URL must be a valid URL'),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  openedAt: z.coerce.date().optional(),
  closesAt: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
  isDuplicate: z.boolean().default(false),
  duplicateOf: z.string().optional(),
});

export const UpdateJobPostingSchema = CreateJobPostingSchema.partial();

export type CreateJobPostingInput = z.infer<typeof CreateJobPostingSchema>;
export type UpdateJobPostingInput = z.infer<typeof UpdateJobPostingSchema>;

// Aliases for compatibility with apps/be
export const CreateJobSchema = CreateJobPostingSchema;
export const UpdateJobSchema = UpdateJobPostingSchema;
export type CreateJobInput = CreateJobPostingInput;
export type UpdateJobInput = UpdateJobPostingInput;

/* ------------------------------------------------------------------ */
/*  Workspace & Auth DTO Schemas                                      */
/* ------------------------------------------------------------------ */

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase alphanumeric characters and hyphens'),
});
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
  workspaceSlug: z.string().optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;

export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});
export type PasswordResetConfirmInput = z.infer<typeof PasswordResetConfirmSchema>;

export const MfaVerifySchema = z.object({
  token: z.string().length(6, 'MFA code must be exactly 6 characters'),
});
export type MfaVerifyInput = z.infer<typeof MfaVerifySchema>;

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

/* ------------------------------------------------------------------ */
/*  Analytics & Data Reporting Schemas                                */
/* ------------------------------------------------------------------ */

export interface TrendDataPoint {
  date: string;
  count: number;
}

export interface WorkspaceAnalyticsOverview {
  workspaceId: string;
  companies: {
    total: number;
    activeHiring: number;
    byTier: {
      TIER_1: number;
      TIER_2: number;
      TIER_3: number;
      UNASSIGNED: number;
    };
    trend: TrendDataPoint[];
  };
  recruiters: {
    total: number;
    verified: number;
    withEmail: number;
    verificationRate: number;
    byStatus: Record<string, number>;
    trend: TrendDataPoint[];
  };
  jobs: {
    total: number;
    active: number;
    byWorkMode: Record<string, number>;
    byJobType: Record<string, number>;
    trend: TrendDataPoint[];
  };
  systemHealth: {
    status: 'OPTIMAL' | 'DEGRADED' | 'OPERATIONAL';
    deliverabilityIndex: number;
    lastSynchronizedAt: string;
  };
}

export interface WorkspaceAnalyticsBreakdown {
  workspaceId: string;
  topIndustries: Array<{ industry: string; count: number }>;
  topSkills: Array<{ skill: string; count: number }>;
  recruiterVerificationDistribution: Array<{ status: string; count: number; percentage: number }>;
  jobModeDistribution: Array<{ mode: string; count: number; percentage: number }>;
}

export interface DataChatRequest {
  message: string;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
}

export interface DataChatResponse {
  reply: string;
  thoughts?: string;
  suggestions: string[];
}

