/**
 * Opaque-box HTTP Test Client with Cookie Jar.
 *
 * Interacts with the running backend service strictly over HTTP.
 * Automatically persists session cookies (access_token, refresh_token, csrf_token)
 * and supports custom headers (x-workspace-id, x-csrf-token, authorization).
 */

export interface HttpResponse<T = any> {
  status: number;
  headers: Record<string, string>;
  body: T;
  rawText: string;
}

export class TestHttpClient {
  private cookieJar: Map<string, string> = new Map();
  private defaultHeaders: Record<string, string> = {};

  constructor(public readonly baseUrl: string) {}

  setHeader(name: string, value: string): void {
    this.defaultHeaders[name.toLowerCase()] = value;
  }

  removeHeader(name: string): void {
    delete this.defaultHeaders[name.toLowerCase()];
  }

  setBearerToken(token: string): void {
    this.setHeader("authorization", `Bearer ${token}`);
  }

  setWorkspaceId(workspaceId: string): void {
    this.setHeader("x-workspace-id", workspaceId);
  }

  setCsrfToken(csrfToken: string): void {
    this.setHeader("x-csrf-token", csrfToken);
  }

  getCookie(name: string): string | undefined {
    return this.cookieJar.get(name);
  }

  setCookie(name: string, value: string): void {
    this.cookieJar.set(name, value);
  }

  clearCookies(): void {
    this.cookieJar.clear();
  }

  clearAuth(): void {
    this.clearCookies();
    this.removeHeader("authorization");
    this.removeHeader("x-workspace-id");
    this.removeHeader("x-csrf-token");
  }

  private buildCookieHeader(): string {
    const pairs: string[] = [];
    for (const [name, value] of this.cookieJar.entries()) {
      pairs.push(`${name}=${value}`);
    }
    return pairs.join("; ");
  }

  private updateCookiesFromHeaders(headers: Headers): void {
    const rawSetCookie = headers.get("set-cookie");
    if (!rawSetCookie) return;

    // Node 20+ Headers.getSetCookie() or parse raw comma-separated cookies
    const cookieStrings = typeof (headers as any).getSetCookie === "function"
      ? (headers as any).getSetCookie()
      : rawSetCookie.split(/,(?=[^;]+;)/);

    for (const cookieStr of cookieStrings) {
      const parts = cookieStr.split(";");
      const [nameVal] = parts;
      if (nameVal) {
        const eqIdx = nameVal.indexOf("=");
        if (eqIdx > 0) {
          const key = nameVal.substring(0, eqIdx).trim();
          const val = nameVal.substring(eqIdx + 1).trim();
          if (parts.some((p: string) => p.trim().toLowerCase().startsWith("max-age=0") || p.trim().toLowerCase().startsWith("expires=thu, 01 jan 1970"))) {
            this.cookieJar.delete(key);
          } else {
            this.cookieJar.set(key, val);
          }
        }
      }
    }
  }

  async request<T = any>(
    path: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<HttpResponse<T>> {
    const method = options.method || "GET";
    const url = path.startsWith("http") ? path : `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

    const headers: Record<string, string> = {
      "content-type": "application/json",
      ...this.defaultHeaders,
      ...(options.headers || {}),
    };

    const cookieHeader = this.buildCookieHeader();
    if (cookieHeader) {
      headers["cookie"] = cookieHeader;
    }

    // Auto-inject CSRF token if present in cookies and not explicitly specified
    const csrfCookie = this.cookieJar.get("csrf_token");
    if (csrfCookie && headers["x-csrf-token"] === undefined) {
      headers["x-csrf-token"] = csrfCookie;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (options.body !== undefined && method !== "GET") {
      fetchOptions.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    }

    const res = await fetch(url, fetchOptions);
    this.updateCookiesFromHeaders(res.headers);

    const rawText = await res.text();
    let body: any = rawText;
    try {
      body = JSON.parse(rawText);
    } catch {
      // Keep as text if not JSON
    }

    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((val, key) => {
      responseHeaders[key.toLowerCase()] = val;
    });

    return {
      status: res.status,
      headers: responseHeaders,
      body,
      rawText,
    };
  }

  get<T = any>(path: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>(path, { method: "GET", headers });
  }

  post<T = any>(path: string, body?: any, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>(path, { method: "POST", body, headers });
  }

  patch<T = any>(path: string, body?: any, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>(path, { method: "PATCH", body, headers });
  }

  delete<T = any>(path: string, headers?: Record<string, string>): Promise<HttpResponse<T>> {
    return this.request<T>(path, { method: "DELETE", headers });
  }
}
