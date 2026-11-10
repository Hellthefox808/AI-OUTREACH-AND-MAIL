import { describe, it, expect } from "vitest";
import { validateMessage } from "./message-handler";
import { validateApiOrigin } from "../api/api-client";

describe("Extension Message Handler", () => {
  it("validates a valid message schema successfully", () => {
    const raw = {
      type: "CAPTURE_JOB",
      payload: { title: "Software Engineer", company: "Stripe" },
      timestamp: Date.now(),
      requestId: "req-12345",
    };
    const validated = validateMessage(raw);
    expect(validated.type).toBe("CAPTURE_JOB");
    expect(validated.requestId).toBe("req-12345");
  });

  it("throws ZodError on invalid message missing type", () => {
    const invalid = { payload: "no-type" };
    expect(() => validateMessage(invalid)).toThrow();
  });

  it("validates allowlisted API origins", () => {
    expect(validateApiOrigin("http://localhost:4000")).toBe(true);
    expect(validateApiOrigin("https://malicious-site.com")).toBe(false);
  });
});
