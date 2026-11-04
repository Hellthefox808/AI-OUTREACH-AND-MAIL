/**
 * Mongoose model registry. Models are defined in src/models/ and exported
 * here so repositories depend on a single stable surface.
 */

export { User } from './user.model';
export { Workspace } from './workspace.model';
export { Membership } from './membership.model';
export type { UserDocument, WorkspaceDocument, MembershipDocument } from './index.types';

export { Company } from './company.model';
export type { CompanyDocument } from './company.model';

export { Recruiter } from './recruiter.model';
export type { RecruiterDocument } from './recruiter.model';

export { JobPosting } from './job-posting.model';
export type { JobPostingDocument } from './job-posting.model';
