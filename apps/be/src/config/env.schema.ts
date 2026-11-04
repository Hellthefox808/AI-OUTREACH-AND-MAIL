/**
 * Environment validation schema for the backend.
 *
 * Validates required configuration at startup. Throws an actionable error
 * if any required variable is missing or invalid. Never logs secret values.
 */

import { z } from "zod";

const BackendEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().transform((val) => parseInt(val, 10)).default("4000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  ENCRYPTION_MASTER_KEY: z.string().min(1, "ENCRYPTION_MASTER_KEY is required"),
  API_BASE_URL: z.string().url().default("http://localhost:4000"),
  FE_BASE_URL: z.string().url().default("http://localhost:3000"),
  ALLOWED_ORIGINS: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  OTEL_SERVICE_NAME: z.string().default("career-intelligence-os-be"),
  LOG_LEVEL: z.enum(["error", "warn", "log", "debug"]).default("log"),
});

export type BackendEnv = z.infer<typeof BackendEnvSchema>;

export function validateEnv(env: Record<string, string | undefined>): BackendEnv {
  const result = BackendEnvSchema.safeParse(env);
  if (!result.success) {
    const missing = result.error.errors.map((e) => e.path.join(".")).join(", ");
    throw new Error(
      `Missing or invalid backend configuration: ${missing}. Check your .env file.`,
    );
  }
  return result.data;
}
