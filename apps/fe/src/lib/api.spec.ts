import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  api,
  ApiError,
  API_BASE_URL,
} from './api';

describe('Frontend API Client (apps/fe)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('constructs correct URL and sends credentials: include for auth.getMe', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'usr-1', email: 'test@example.com' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await api.auth.getMe();
    expect(result).toEqual({ id: 'usr-1', email: 'test@example.com' });
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/v1/auth/me`,
      expect.objectContaining({
        credentials: 'include',
      })
    );
  });

  it('handles query parameters for filtering and pagination in companies.list', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [], nextCursor: null, hasMore: false }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await api.companies.list({
      limit: 25,
      cursor: 'cur-123',
      search: 'Google',
      tier: 'TIER_1',
    });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('limit=25');
    expect(calledUrl).toContain('cursor=cur-123');
    expect(calledUrl).toContain('search=Google');
    expect(calledUrl).toContain('tier=TIER_1');
  });

  it('throws ApiError with status and message on HTTP failure', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        statusCode: 401,
        message: 'Invalid email or password',
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(
      api.auth.login({ email: 'wrong@example.com', password: 'wrong' })
    ).rejects.toThrow(ApiError);
  });

  it('handles array validation error messages cleanly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        statusCode: 400,
        message: ['Email is invalid', 'Password too short'],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(
      api.auth.register({ email: 'bad', password: '123', name: 'Test' })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Email is invalid, Password too short',
    });
  });

  it('dispatches data chat queries to analytics.chat endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        reply: 'We have 42 active companies.',
        metrics: { total: 42 },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const response = await api.analytics.chat('how many companies?');
    expect(response.reply).toBe('We have 42 active companies.');
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/v1/analytics/chat`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ message: 'how many companies?' }),
      })
    );
  });
});
