import { describe, it, expect, vi } from 'vitest';
import { HttpExceptionFilter } from './http-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AppError } from '@career-intelligence/shared';

describe('HttpExceptionFilter (RFC 9457)', () => {
  const createMockHost = (url = '/v1/companies', headers: Record<string, string> = {}) => {
    let responseStatus = 0;
    let responseBody: any = null;
    let responseType = '';

    const mockResponse: any = {
      status: vi.fn().mockImplementation((s: number) => {
        responseStatus = s;
        return mockResponse;
      }),
      json: vi.fn().mockImplementation((body: any) => {
        responseBody = body;
        return mockResponse;
      }),
      type: vi.fn().mockImplementation((t: string) => {
        responseType = t;
        return mockResponse;
      }),
    };

    const mockRequest: any = {
      url,
      headers: {
        'x-request-id': 'req-test-123',
        ...headers,
      },
    };

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
        getNext: () => vi.fn(),
      }),
      getArgs: () => [],
      getArgByIndex: () => null,
      switchToRpc: () => null,
      switchToWs: () => null,
      getType: () => 'http',
    } as unknown as ArgumentsHost;

    return {
      mockHost,
      getStatus: () => responseStatus,
      getBody: () => responseBody,
      getTypeHeader: () => responseType,
    };
  };

  it('formats AppError with RFC 9457 problem details', () => {
    const filter = new HttpExceptionFilter();
    const { mockHost, getStatus, getBody } = createMockHost('/v1/recruiters/123');

    const error = new AppError('NOT_FOUND', 404, 'Candidate not found', { recruiterId: '123' });
    filter.catch(error, mockHost);

    expect(getStatus()).toBe(404);
    const body = getBody();
    expect(body.type).toBe('https://api.careerintelligence.internal/errors/not_found');
    expect(body.status).toBe(404);
    expect(body.detail).toBe('Candidate not found');
    expect(body.instance).toBe('/v1/recruiters/123');
    expect(body.requestId).toBe('req-test-123');
    expect(body.code).toBe('NOT_FOUND');
    expect(body.invalidParams).toEqual({ recruiterId: '123' });
    expect(body.statusCode).toBe(404);
  });

  it('formats standard NestJS HttpException correctly', () => {
    const filter = new HttpExceptionFilter();
    const { mockHost, getStatus, getBody } = createMockHost();

    const exception = new HttpException('Forbidden resource', HttpStatus.FORBIDDEN);
    filter.catch(exception, mockHost);

    expect(getStatus()).toBe(HttpStatus.FORBIDDEN);
    const body = getBody();
    expect(body.status).toBe(403);
    expect(body.detail).toBe('Forbidden resource');
    expect(body.type).toBe('https://api.careerintelligence.internal/errors/httpexception');
  });

  it('sets application/problem+json when requested in Accept header', () => {
    const filter = new HttpExceptionFilter();
    const { mockHost, getTypeHeader } = createMockHost('/v1/jobs', {
      accept: 'application/problem+json',
    });

    const error = new AppError('VALIDATION_ERROR', 400, 'Validation failed');
    filter.catch(error, mockHost);

    expect(getTypeHeader()).toBe('application/problem+json');
  });
});
