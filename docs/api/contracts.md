# API Specifications & Contracts

All backend endpoints are prefixed with `/v1` and documented automatically via OpenAPI / Swagger at `/docs`.

## 1. Authentication & Session Protocol

### `POST /v1/auth/register`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Minimum8Characters!",
    "name": "Jane Doe",
    "workspaceSlug": "acme-corp"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": "6730a8...",
      "email": "user@example.com",
      "workspaceId": "6730a9...",
      "permissions": ["auth:login", "company:read", "..."]
    }
  }
  ```
- **Cookies**: Sets `access_token` (15m) and `refresh_token` (7d) as HTTP-only secure cookies.

### `POST /v1/auth/login`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123"
  }
  ```
- **Response (200 OK)**: User profile and accessToken; sets session cookies.

### `POST /v1/auth/logout`
- **Headers/Cookies**: Reads `access_token` cookie or `Authorization: Bearer <token>`.
- **Response (200 OK)**: `{ "revoked": true }`. Clears token cookies.

### `POST /v1/auth/refresh`
- **Request Body (or Cookie)**: `{ "refresh_token": "..." }`.
- **Response (200 OK)**: New access token, new refresh token, rotates session.

---

## 2. Intelligence & Resource APIs

### `GET /v1/companies`
- **Headers**: `Authorization: Bearer <token>` or HTTP-only cookie.
- **Query Params**: `limit` (integer, default 50), `cursor` (string ObjectId).
- **Response (200 OK)**: Array of company records matching the caller's workspace.

### `POST /v1/companies`
- **Request Body**:
  ```json
  {
    "legalName": "Anthropic PBC",
    "displayName": "Anthropic",
    "domain": "anthropic.com",
    "canonicalWebsite": "https://www.anthropic.com",
    "tier": "TIER_1",
    "industries": ["ai_ml", "generative_ai"]
  }
  ```
- **Response (201 Created)**: Created company record.

### `GET /v1/recruiters`
- **Query Params**: `limit`, `cursor`.
- **Response (200 OK)**: Recruiter contacts scoped to workspace.

### `GET /v1/jobs`
- **Query Params**: `limit`, `cursor`.
- **Response (200 OK)**: Job postings scoped to workspace.

### `GET /v1/workspaces`
- **Response (200 OK)**: Workspaces current user belongs to.

