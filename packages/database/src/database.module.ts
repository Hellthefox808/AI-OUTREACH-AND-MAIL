/**
 * Database module.
 *
 * Registers all Mongoose models and provides the repository layer to the
 * NestJS application. Imported by the backend AppModule.
 */

import { Module, Global } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import {
  User,
  UserSchema,
  UserDocument,
} from "./models/user.model";
import {
  Workspace,
  WorkspaceSchema,
  WorkspaceDocument,
} from "./models/workspace.model";
import {
  Membership,
  MembershipSchema,
  MembershipDocument,
} from "./models/membership.model";
import {
  Company,
  CompanySchema,
  CompanyDocument,
} from "./models/company.model";
import {
  Recruiter,
  RecruiterSchema,
  RecruiterDocument,
} from "./models/recruiter.model";
import {
  JobPosting,
  JobPostingSchema,
  JobPostingDocument,
} from "./models/job-posting.model";
import {
  Session,
  SessionSchema,
  SessionDocument,
} from "./models/session.model";
import {
  Role,
  RoleSchema,
  RoleDocument,
} from "./models/role.model";
import {
  Permission,
  PermissionSchema,
  PermissionDocument,
} from "./models/permission.model";
import {
  ExternalIdentity,
  ExternalIdentitySchema,
  ExternalIdentityDocument,
} from "./models/external-identity.model";
import {
  AuditEvent,
  AuditEventSchema,
  AuditEventDocument,
} from "./models/audit-event.model";

import { UserRepository } from "./repositories/user.repository";
import { WorkspaceRepository } from "./repositories/workspace.repository";
import { SessionRepository } from "./repositories/session.repository";
import { CompanyRepository } from "./repositories/company.repository";
import { RecruiterRepository } from "./repositories/recruiter.repository";
import { JobRepository } from "./repositories/job.repository";
import { MembershipRepository } from "./repositories/membership.repository";
import { RoleRepository } from "./repositories/role.repository";
import { PermissionRepository } from "./repositories/permission.repository";

const MODELS = [
  User,
  Workspace,
  Membership,
  Company,
  Recruiter,
  JobPosting,
  Session,
  Role,
  Permission,
  ExternalIdentity,
  AuditEvent,
];

const MODEL_SCHEMAS = [
  { name: User.name, schema: UserSchema },
  { name: Workspace.name, schema: WorkspaceSchema },
  { name: Membership.name, schema: MembershipSchema },
  { name: Company.name, schema: CompanySchema },
  { name: Recruiter.name, schema: RecruiterSchema },
  { name: JobPosting.name, schema: JobPostingSchema },
  { name: Session.name, schema: SessionSchema },
  { name: Role.name, schema: RoleSchema },
  { name: Permission.name, schema: PermissionSchema },
  { name: ExternalIdentity.name, schema: ExternalIdentitySchema },
  { name: AuditEvent.name, schema: AuditEventSchema },
];

const REPOSITORIES = [
  UserRepository,
  WorkspaceRepository,
  SessionRepository,
  CompanyRepository,
  RecruiterRepository,
  JobRepository,
  MembershipRepository,
  RoleRepository,
  PermissionRepository,
];

@Global()
@Module({
  imports: [
    MongooseModule.forFeature(MODEL_SCHEMAS),
  ],
  providers: [...REPOSITORIES],
  exports: [...MODELS, ...REPOSITORIES],
})
export class DatabaseModule {}
