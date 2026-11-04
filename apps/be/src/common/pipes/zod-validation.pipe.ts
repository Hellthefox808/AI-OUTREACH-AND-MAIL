/**
 * Zod validation pipe.
 *
 * Validates request bodies against a Zod schema and throws a structured
 * ValidationError on failure.
 */

import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from "@nestjs/common";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "@career-intelligence/shared";

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema<any>) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== "body") {
      return value;
    }
    try {
      return this.schema.parse(value);
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        }));
        throw new ValidationError("Request validation failed", { errors: details });
      }
      throw new BadRequestException("Invalid request body");
    }
  }
}
