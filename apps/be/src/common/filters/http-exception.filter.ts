/**
 * HTTP exception filter.
 *
 * Produces consistent, structured error responses adhering to RFC 9457 Problem Details
 * for HTTP APIs without leaking internal implementation details, provider credentials
 * or sensitive error data in production.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '@career-intelligence/shared';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

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

    const instance = request?.url || '/';
    const requestId =
      (request as any)?.requestId ||
      (request?.headers
        ? request.headers['x-request-id'] || request.headers['x-correlation-id']
        : undefined);

    // RFC 9457 Problem Details standard object with full backward compatibility
    const errorResponse = {
      // RFC 9457 Standard Properties
      type: `https://api.careerintelligence.internal/errors/${code.toLowerCase()}`,
      title: code.replace(/([A-Z])/g, ' $1').trim(),
      status: statusCode,
      detail: message,
      instance,

      // Backward-compatible properties
      statusCode,
      code,
      message,
      ...(requestId ? { requestId } : {}),
      ...(details ? { details, invalidParams: details } : {}),
      ...(process.env.NODE_ENV !== 'production' && exception instanceof Error
        ? { stack: exception.stack }
        : {}),
      timestamp: new Date().toISOString(),
    };

    if (request?.headers?.accept?.includes('application/problem+json')) {
      response.type('application/problem+json');
    }

    response.status(statusCode).json(errorResponse);
  }
}
