import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { ExecutionContext, CallHandler, ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('IdempotencyInterceptor', () => {
  let interceptor: IdempotencyInterceptor;

  beforeEach(() => {
    IdempotencyInterceptor.clearStore();
    interceptor = new IdempotencyInterceptor();
  });

  const createMockContext = (options: {
    method?: string;
    path?: string;
    headers?: Record<string, string>;
    body?: any;
    workspaceId?: string;
  }) => {
    const headers = options.headers || {};
    const responseHeaders: Record<string, string> = {};
    let responseStatus = 200;

    const mockRequest: any = {
      method: options.method || 'POST',
      path: options.path || '/v1/jobs',
      headers,
      body: options.body || { title: 'Software Engineer' },
      workspaceId: options.workspaceId || 'ws-test-1',
    };

    const mockResponse: any = {
      statusCode: 200,
      setHeader: vi.fn((key: string, val: string) => {
        responseHeaders[key.toLowerCase()] = val;
      }),
      status: vi.fn((status: number) => {
        responseStatus = status;
        return mockResponse;
      }),
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
        getNext: () => vi.fn(),
      }),
      getHandler: () => vi.fn(),
      getClass: () => vi.fn(),
      getArgs: () => [],
      getArgByIndex: () => null,
      switchToRpc: () => null,
      switchToWs: () => null,
      getType: () => 'http',
    } as unknown as ExecutionContext;

    return {
      mockContext,
      mockRequest,
      mockResponse,
      getResponseHeaders: () => responseHeaders,
      getResponseStatus: () => responseStatus,
    };
  };

  it('passes through safe GET requests without requiring idempotency key', async () => {
    const { mockContext } = createMockContext({ method: 'GET' });
    const next: CallHandler = { handle: () => of({ success: true }) };

    const result = await interceptor.intercept(mockContext, next).toPromise();
    expect(result).toEqual({ success: true });
  });

  it('executes and caches mutating request when Idempotency-Key is provided', async () => {
    const { mockContext, mockResponse } = createMockContext({
      headers: { 'idempotency-key': 'key-uuid-12345678' },
    });
    mockResponse.statusCode = 201;
    const next: CallHandler = { handle: () => of({ id: 'job-1', created: true }) };

    const firstExecution = await interceptor.intercept(mockContext, next).toPromise();
    expect(firstExecution).toEqual({ id: 'job-1', created: true });

    // Second call with the same idempotency key and payload
    const secondCall = createMockContext({
      headers: { 'idempotency-key': 'key-uuid-12345678' },
    });
    const next2: CallHandler = { handle: () => of({ unexpected: 'should not run' }) };

    const replayedExecution = await interceptor.intercept(secondCall.mockContext, next2).toPromise();
    expect(replayedExecution).toEqual({ id: 'job-1', created: true });
    expect(secondCall.mockResponse.setHeader).toHaveBeenCalledWith('Idempotent-Replayed', 'true');
    expect(secondCall.mockResponse.setHeader).toHaveBeenCalledWith('X-Cache-Lookup', 'HIT');
  });

  it('throws 409 Conflict when duplicate request is received while first is still pending', () => {
    const { mockContext } = createMockContext({
      headers: { 'idempotency-key': 'key-uuid-pending' },
    });
    // Create an uncompleted observable that remains in flight
    const inFlightNext: CallHandler = { handle: () => of({ done: true }) };

    // Start first request
    interceptor.intercept(mockContext, inFlightNext);

    // Immediate concurrent request
    const concurrentCall = createMockContext({
      headers: { 'idempotency-key': 'key-uuid-pending' },
    });
    const nextConcurrent: CallHandler = { handle: () => of({ done: true }) };

    expect(() => interceptor.intercept(concurrentCall.mockContext, nextConcurrent)).toThrow(ConflictException);
  });

  it('throws 422 Unprocessable Entity when same key is submitted with different payload', async () => {
    const { mockContext } = createMockContext({
      headers: { 'idempotency-key': 'key-uuid-mismatch' },
      body: { title: 'First Version' },
    });
    const next: CallHandler = { handle: () => of({ id: '1' }) };
    await interceptor.intercept(mockContext, next).toPromise();

    const mismatchCall = createMockContext({
      headers: { 'idempotency-key': 'key-uuid-mismatch' },
      body: { title: 'Completely Different Payload' },
    });
    const next2: CallHandler = { handle: () => of({ id: '2' }) };

    expect(() => interceptor.intercept(mismatchCall.mockContext, next2)).toThrow(UnprocessableEntityException);
  });

  it('releases lease lock when request throws an error to allow clean retry', async () => {
    const { mockContext } = createMockContext({
      headers: { 'idempotency-key': 'key-uuid-failing' },
    });
    const failingNext: CallHandler = { handle: () => throwError(() => new Error('DB Connection Timeout')) };

    try {
      await interceptor.intercept(mockContext, failingNext).toPromise();
    } catch {
      // Expected failure
    }

    // Retrying should not fail with 409 Conflict
    const retryCall = createMockContext({
      headers: { 'idempotency-key': 'key-uuid-failing' },
    });
    const successfulNext: CallHandler = { handle: () => of({ recovered: true }) };
    const retryResult = await interceptor.intercept(retryCall.mockContext, successfulNext).toPromise();
    expect(retryResult).toEqual({ recovered: true });
  });
});
