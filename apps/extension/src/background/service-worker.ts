/**
 * Background service worker — Manifest V3.
 *
 * Stateless between executions where possible. Persists durable state
 * through chrome.storage. Never stores MongoDB credentials, AWS secrets,
 * or mailbox refresh tokens.
 */

import { validateApiOrigin } from "../api/api-client";

chrome.runtime.onInstalled.addListener(async () => {
  // eslint-disable-next-line no-console
  console.log("[extension] Service worker installed");
  await chrome.storage.local.set({ installedAt: Date.now() });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message: unknown, _sender: chrome.runtime.MessageSender) {
  const { type } = message as { type: string };
  switch (type) {
    case "PING":
      return { ok: true, service: "career-intelligence-os-extension" };
    case "VALIDATE_ORIGIN":
      return { valid: validateApiOrigin(_sender.origin ?? "") };
    default:
      return { error: `Unknown message type: ${type}` };
  }
}
