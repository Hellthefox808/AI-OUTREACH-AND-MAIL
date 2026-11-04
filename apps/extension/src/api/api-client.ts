/**
 * API client — authenticated communication with the backend.
 *
 * Validates the API origin before making requests. Attaches the access token
 * from extension storage when available. Never stores refresh tokens.
 */

import { extensionStorage } from "../storage/storage";

export const API_ORIGIN_ALLOWLIST = ["http://localhost:4000"];

export function validateApiOrigin(origin: string): boolean {
  return API_ORIGIN_ALLOWLIST.includes(origin);
}

export async function extensionFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const origin = process.env.API_BASE_URL || "http://localhost:4000";
  if (!validateApiOrigin(origin)) {
    throw new Error(`API origin not allowed: ${origin}`);
  }

  const token = (await extensionStorage.get<string>("access_token")) ?? undefined;

  const response = await fetch(`${origin}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    ...init,
  });

  if (response.status === 401) {
    // Token expired or invalid — signal auth required
    throw new Error("AUTH_REQUIRED");
  }

  return response;
}

export async function extensionFetchJson<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await extensionFetch(path, init);
  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as T;
}
