/**
 * Frontend API client for Career Intelligence OS.
 *
 * All requests are routed through this typed client with cookie credentials
 * and structured error handling.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // sends HTTP-only session cookies
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    let details: unknown;
    try {
      const errData = (await response.json()) as ApiErrorResponse;
      errorMessage = Array.isArray(errData.message)
        ? errData.message.join(', ')
        : errData.message || errorMessage;
      details = errData;
    } catch {
      // Non-JSON response
    }
    throw new ApiError(response.status, errorMessage, details);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  roles: string[];
  workspaceIds: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CompanyItem {
  _id: string;
  workspaceId: string;
  legalName: string;
  displayName: string;
  domain: string;
  canonicalWebsite?: string;
  tier?: 'TIER_1' | 'TIER_2' | 'TIER_3';
  industries?: string[];
  createdAt: string;
}

export interface RecruiterItem {
  _id: string;
  workspaceId: string;
  companyId?: string;
  name: string;
  email?: string;
  designation?: string;
  department?: string;
  verificationStatus: string;
  createdAt: string;
}

export interface JobItem {
  _id: string;
  workspaceId: string;
  companyId?: string;
  title: string;
  location?: string;
  workMode?: 'REMOTE' | 'HYBRID' | 'ONSITE';
  jobType?: 'FULL_TIME' | 'CONTRACT' | 'PART_TIME' | 'INTERNSHIP';
  applicationUrl?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'DRAFT' | 'ARCHIVED';
  createdAt: string;
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ user: UserProfile; accessToken: string }>('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    register: (data: { email: string; password: string; name: string; workspaceName?: string }) =>
      request<{ user: UserProfile; accessToken: string }>('/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getMe: () => request<UserProfile>('/v1/auth/me'),

    logout: () =>
      request<{ status: string }>('/v1/auth/logout', {
        method: 'POST',
      }),
  },

  companies: {
    list: (params?: { limit?: number; cursor?: string }) => {
      const search = new URLSearchParams();
      if (params?.limit) search.set('limit', params.limit.toString());
      if (params?.cursor) search.set('cursor', params.cursor);
      const query = search.toString();
      return request<PaginatedResponse<CompanyItem>>(`/v1/companies${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => request<CompanyItem>(`/v1/companies/${id}`),

    create: (data: Partial<CompanyItem>) =>
      request<CompanyItem>('/v1/companies', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  recruiters: {
    list: (params?: { limit?: number; cursor?: string }) => {
      const search = new URLSearchParams();
      if (params?.limit) search.set('limit', params.limit.toString());
      if (params?.cursor) search.set('cursor', params.cursor);
      const query = search.toString();
      return request<PaginatedResponse<RecruiterItem>>(`/v1/recruiters${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => request<RecruiterItem>(`/v1/recruiters/${id}`),

    create: (data: Partial<RecruiterItem>) =>
      request<RecruiterItem>('/v1/recruiters', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  jobs: {
    list: (params?: { limit?: number; cursor?: string }) => {
      const search = new URLSearchParams();
      if (params?.limit) search.set('limit', params.limit.toString());
      if (params?.cursor) search.set('cursor', params.cursor);
      const query = search.toString();
      return request<PaginatedResponse<JobItem>>(`/v1/jobs${query ? `?${query}` : ''}`);
    },

    getById: (id: string) => request<JobItem>(`/v1/jobs/${id}`),

    create: (data: Partial<JobItem>) =>
      request<JobItem>('/v1/jobs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};

