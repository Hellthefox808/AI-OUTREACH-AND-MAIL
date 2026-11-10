/**
 * E2E Test Environment Configuration and Secrets.
 *
 * Defines deterministic keys, secrets, and environment overrides for the
 * test runner.
 */

export const TEST_CONFIG = {
  JWT_ACCESS_SECRET: "test-jwt-access-secret-minimum-32-characters-secure!",
  JWT_REFRESH_SECRET: "test-jwt-refresh-secret-minimum-32-characters-secure!",
  NODE_ENV: "test",
  DEFAULT_WORKSPACE_NAME: "Acme Corporation",
  DEFAULT_WORKSPACE_SLUG: "acme-corp",
  TEST_TIMEOUT: 30000,
};

// Set environment variables prior to any NestJS / ConfigModule boot
process.env.JWT_ACCESS_SECRET = TEST_CONFIG.JWT_ACCESS_SECRET;
process.env.JWT_REFRESH_SECRET = TEST_CONFIG.JWT_REFRESH_SECRET;
process.env.NODE_ENV = TEST_CONFIG.NODE_ENV;
