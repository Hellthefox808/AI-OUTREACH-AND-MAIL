/**
 * Test mock tokens for @career-intelligence/database.
 *
 * Provides token classes for NestJS dependency injection in E2E tests
 * without executing Mongoose decorator metadata reflection.
 */

export class BaseRepository<T = any> {}

export class UserRepository {}
export class WorkspaceRepository {}
export class SessionRepository {}
export class MembershipRepository {}
export class RoleRepository {}
export class PermissionRepository {}
export class CompanyRepository {}
export class RecruiterRepository {}
export class JobRepository {}

export class DatabaseModule {}
export const connectDatabase = () => Promise.resolve();
export const closeDatabase = () => Promise.resolve();
export const mongoose = {};
