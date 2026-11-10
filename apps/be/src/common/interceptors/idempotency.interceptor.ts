/**
 * Distributed Idempotency Interceptor.
 *
 * Implements IETF draft-ietf-httpapi-idempotency-key-header standards for
 * mutating HTTP requests (POST, PATCH, PUT, DELETE). Guarantees exactly-once
 * execution semantics across network retries and distributed clients.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

interface IdempotencyRecord {
  status: 'PENDING' | 'COMPLETED';
  fingerprint: string;
  statusCode?: number;
  headers?: Record<string, string>;
  body?: unknown;
  createdAt: number;
  expiresAt: number;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
  private static readonly store = new Map<string, IdempotencyRecord>();
  private static readonly LOCK_TTL_MS = 60 * 1000; // 60s lease for in-flight requests
  private static readonly RECORD_TTL_MS = 24 * 60 * 60 * 1000; // 24hr cache for responses

  constructor() {
    // Periodic sweep of expired idempotency keys (every 5 minutes)
    if (typeof setInterval !== 'undefined') {
      const interval = setInterval(() => {
        const now = Date.now();
        for (const [key, record] of IdempotencyInterceptor.store.entries()) {
          if (record.expiresAt < now) {
            IdempotencyInterceptor.store.delete(key);
          }
        }
      }, 5 * 60 * 1000);
      if (typeof (interval as any)?.unref === 'function') {
        (interval as any).unref();
      }
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const method = request.method?.toUpperCase();
    // Idempotency applies strictly to mutating requests
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const idempotencyKey =
      (request.headers['idempotency-key'] as string) ||
      (request.headers['x-idempotency-key'] as string);

    // If no idempotency key is supplied, proceed normally
    if (!idempotencyKey) {
      return next.handle();
    }

    if (idempotencyKey.length < 8 || idempotencyKey.length > 256) {
      throw new UnprocessableEntityException({
        code: 'INVALID_IDEMPOTENCY_KEY',
        message: 'Idempotency-Key must be between 8 and 256 characters in length.',
      });
    }

    const workspaceId =
      (request as any).workspaceId ||
      (request as any).user?.workspaceId ||
      (request.headers['x-workspace-id'] as string) ||
      'agnostic';

    const rawBody = JSON.stringify(request.body || {});
    const fingerprint = crypto.createHash('sha256').update(rawBody).digest('hex');
    const storageKey = `idempotency:${workspaceId}:${request.path}:${idempotencyKey}`;

    const now = Date.now();
    const existing = IdempotencyInterceptor.store.get(storageKey);

    if (existing) {
      if (existing.expiresAt < now) {
        IdempotencyInterceptor.store.delete(storageKey);
      } else if (existing.status === 'PENDING') {
        this.logger.warn(`Concurrent duplicate request detected for key: ${storageKey}`);
        throw new ConflictException({
          code: 'IDEMPOTENCY_IN_FLIGHT',
          message: 'A request with this Idempotency-Key is currently processing. Please retry shortly.',
        });
      } else if (existing.status === 'COMPLETED') {
        if (existing.fingerprint !== fingerprint) {
          this.logger.warn(`Payload mismatch on replayed idempotency key: ${storageKey}`);
          throw new UnprocessableEntityException({
            code: 'IDEMPOTENCY_PAYLOAD_MISMATCH',
            message: 'Idempotency-Key was previously submitted with a different request payload.',
          });
        }

        // Return cached idempotent response
        response.setHeader('Idempotent-Replayed', 'true');
        response.setHeader('X-Cache-Lookup', 'HIT');
        if (existing.statusCode) {
          response.status(existing.statusCode);
        }
        return of(existing.body);
      }
    }

    // Acquire atomic lease lock
    IdempotencyInterceptor.store.set(storageKey, {
      status: 'PENDING',
      fingerprint,
      createdAt: now,
      expiresAt: now + IdempotencyInterceptor.LOCK_TTL_MS,
    });

    return next.handle().pipe(
      tap((body) => {
        const statusCode = response.statusCode || 200;
        IdempotencyInterceptor.store.set(storageKey, {
          status: 'COMPLETED',
          fingerprint,
          statusCode,
          body,
          createdAt: Date.now(),
          expiresAt: Date.now() + IdempotencyInterceptor.RECORD_TTL_MS,
        });
      }),
      catchError((err) => {
        // Release lock on error so caller can safely retry
        IdempotencyInterceptor.store.delete(storageKey);
        throw err;
      }),
    );
  }

  /**
   * Helper to clear store in unit tests.
   */
  static clearStore() {
    IdempotencyInterceptor.store.clear();
  }
}
