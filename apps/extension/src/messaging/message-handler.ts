/**
 * Message validation — strict schema for extension↔backend messaging.
 */

import { z } from "zod";

export const ExtensionMessageSchema = z.object({
  type: z.string(),
  payload: z.unknown().optional(),
  timestamp: z.number().optional(),
  requestId: z.string().optional(),
});

export type ExtensionMessage = z.infer<typeof ExtensionMessageSchema>;

export function validateMessage(message: unknown): ExtensionMessage {
  return ExtensionMessageSchema.parse(message);
}
