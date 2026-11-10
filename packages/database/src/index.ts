/**
 * Database package barrel.
 *
 * Exports the Mongoose connection helper and all registered domain models
 * and repositories. Frontend and extension must never import from this package.
 */

export { DatabaseModule } from "./database.module";
export { connectDatabase, closeDatabase, mongoose } from "./connection";

export { User, UserSchema, type UserDocument } from "./models/user.model";

export { Workspace, WorkspaceSchema, type WorkspaceDocument } from "./models/workspace.model";

export {
  Membership,
  MembershipSchema,
  type MembershipDocument,
  MEMBERSHIP_ROLES,
  type MembershipRole,
} from "./models/membership.model";

export { Company, CompanySchema, type CompanyDocument } from "./models/company.model";

export { Recruiter, RecruiterSchema, type RecruiterDocument } from "./models/recruiter.model";

export {
  JobPosting,
  JobPostingSchema,
  type JobPostingDocument,
  JOB_TYPES,
  type JobType,
  WORK_MODES,
  type WorkMode,
} from "./models/job-posting.model";

export { Session, SessionSchema, type SessionDocument } from "./models/session.model";
export { Role, RoleSchema, type RoleDocument } from "./models/role.model";
export { Permission, PermissionSchema, type PermissionDocument } from "./models/permission.model";
export {
  ExternalIdentity,
  ExternalIdentitySchema,
  type ExternalIdentityDocument,
} from "./models/external-identity.model";
export { AuditEvent, AuditEventSchema, type AuditEventDocument } from "./models/audit-event.model";

export { BaseRepository } from "./repositories/base.repository";
export { UserRepository } from "./repositories/user.repository";
export { WorkspaceRepository } from "./repositories/workspace.repository";
export { SessionRepository } from "./repositories/session.repository";
export { CompanyRepository, type CompanyFilterOptions } from "./repositories/company.repository";
export { RecruiterRepository, type RecruiterFilterOptions } from "./repositories/recruiter.repository";
export { JobRepository, type JobFilterOptions } from "./repositories/job.repository";
export { MembershipRepository } from "./repositories/membership.repository";
export { PermissionRepository } from "./repositories/permission.repository";
export { RoleRepository } from "./repositories/role.repository";
