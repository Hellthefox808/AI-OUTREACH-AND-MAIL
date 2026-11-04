"use client";

import { z } from "zod";

export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}

/**
 * API origin validation for frontend.
 * Ensures the frontend only communicates with allowed backend origins.
 */

export const API_ORIGIN_ALLOWLIST = ["http://localhost:4000"];

export function validateApiOrigin(origin: string): boolean {
  return API_ORIGIN_ALLOWLIST.includes(origin);
}

/**
 * Environment configuration for the frontend.
 * Validates required configuration at build/runtime.
 */

export const FE_ENV_SCHEMA = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:4000"),
});

export type FeEnv = z.infer<typeof FE_ENV_SCHEMA>;

export function getFeEnv(): FeEnv {
  return FE_ENV_SCHEMA.parse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  });
}
