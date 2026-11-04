/**
 * HTTP exception filter.
 *
 * Produces consistent, structured error responses without leaking internal
 * implementation details, provider credentials or sensitive error data.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppError } from '@career-intelligence/shared';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred.';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof AppError) {
      statusCode = exception.statusCode;
      code = exception.code;
      message = exception.message;
      details = exception.details;
      this.logger.warn(`AppError ${code}: ${message}`, { details });
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      code = exception.constructor.name;
      const res = exception.getResponse() as any;
      message = typeof res === 'string' ? res : (res?.message ?? 'An error occurred');
      details = typeof res === 'object' && res?.message === undefined ? res : undefined;
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
      message =
        process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : exception.message;
    }

    const errorResponse = {
      statusCode,
      code,
      message,
      ...(details ? { details } : {}),
      ...(process.env.NODE_ENV !== 'production' && exception instanceof Error
        ? { stack: exception.stack }
        : {}),
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(errorResponse);
  }
}
