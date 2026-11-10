/**
 * Unit tests for ZodValidationPipe.
 * Validates request body schema parsing, error structuring into ValidationError,
 * and non-body parameter pass-through.
 */

import { ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { ValidationError } from "@career-intelligence/shared";
import { ZodValidationPipe } from "./zod-validation.pipe";
import { describe, it, expect } from "vitest";

describe("ZodValidationPipe", () => {
  const testSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    age: z.number().int().min(18).optional(),
  });

  const pipe = new ZodValidationPipe(testSchema);

  it("should pass through values unmodified when metadata.type is not 'body'", () => {
    const nonBodyMetadata: ArgumentMetadata = {
      type: "query",
      metatype: Object,
      data: "q",
    };

    const input = { invalid: 123 };
    const result = pipe.transform(input, nonBodyMetadata);
    expect(result).toBe(input);
  });

  it("should parse and return sanitized data when body matches schema", () => {
    const bodyMetadata: ArgumentMetadata = {
      type: "body",
      metatype: Object,
    };

    const validPayload = {
      name: "Alice Smith",
      email: "alice@example.com",
      age: 30,
    };

    const result = pipe.transform(validPayload, bodyMetadata);
    expect(result).toEqual(validPayload);
  });

  it("should throw ValidationError with details array when validation fails", () => {
    const bodyMetadata: ArgumentMetadata = {
      type: "body",
      metatype: Object,
    };

    const invalidPayload = {
      name: "A", // too short
      email: "not-an-email",
      age: 15, // under 18
    };

    expect.assertions(4);
    try {
      pipe.transform(invalidPayload, bodyMetadata);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const valErr = err as ValidationError;
      expect(valErr.code).toBe("VALIDATION_ERROR");
      expect(valErr.statusCode).toBe(400);
      const errors = valErr.details?.errors as Array<{ path: string; message: string }>;
      expect(errors.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("should throw BadRequestException if parsing throws non-Zod exception", () => {
    const brokenSchema = {
      parse: () => {
        throw new Error("Unexpected crash inside parser");
      },
    } as unknown as z.ZodSchema;

    const brokenPipe = new ZodValidationPipe(brokenSchema);
    const bodyMetadata: ArgumentMetadata = {
      type: "body",
      metatype: Object,
    };

    expect(() => brokenPipe.transform({}, bodyMetadata)).toThrow(BadRequestException);
  });
});
