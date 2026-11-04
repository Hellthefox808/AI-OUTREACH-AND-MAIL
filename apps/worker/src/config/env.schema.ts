/**
 * Environment validation schema for the worker.
 *
 * Validates required configuration at startup. Throws an actionable error
 * if any required variable is missing or invalid. Never logs secret values.
 */

import { z } from "zod";

const WorkerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().transform((val) => parseInt(val, 10)).default("4001"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  LOG_LEVEL: z.enum(["error", "warn", "log", "debug"]).default("log"),
});

export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;

export function validateEnv(env: Record<string, string | undefined>): WorkerEnv {
  const result = WorkerEnvSchema.safeParse(env);
  if (!result.success) {
    const missing = result.error.errors.map((e) => e.path.join(".")).join(", ");
    throw new Error(
      `Missing or invalid worker configuration: ${missing}. Check your .env file.`,
    );
  }
  return result.data;
}
