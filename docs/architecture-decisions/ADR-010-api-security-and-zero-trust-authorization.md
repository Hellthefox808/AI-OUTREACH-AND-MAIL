# ADR-010: Zero-Trust API Security, RFC 9457 Error Architecture & BOLA Mitigation

## Status

Accepted

## Context

APIs represent the primary external attack surface for enterprise platforms. According to the OWASP Top 10 API Security Risks:
1. **Broken Object Level Authorization (BOLA / IDOR - API1:2023):** Attackers manipulate IDs (`recruiterId`, `jobId`, `workspaceId`) in requests to access another tenant's confidential candidate data.
2. **Broken Authentication (API2:2023):** Weak token lifecycles, lack of refresh token rotation, or predictable session identifiers allow account takeover.
3. **Broken Object Property Level Authorization (BOPLA - API3:2023):** Mass assignment allows unauthorized users to modify restricted fields (e.g., escalating roles or altering billing tiers).
4. **Unrestricted Resource Consumption (API4:2023):** Lack of tiered rate limiting enables resource exhaustion and scraping.
5. **Broken Function Level Authorization (BFLA - API5:2023):** Regular members invoke administrative endpoints (`/v1/workspaces/settings`, `/v1/users/delete`).
6. **Inconsistent Error Leakage:** Unhandled exceptions leak database connection strings, collection names, and stack traces, aiding reconnaissance.

## Decision

We establish an end-to-end **Zero-Trust API Security Model**, **Multi-Tenant Guard Architecture**, and **RFC 9457 Problem Details Standard**:

### 1. Global Multi-Tenant Guard Chain (`APP_GUARD`)
All incoming HTTP requests pass sequentially through three global NestJS guards:
1. **`AuthGuard`:**
   - Validates the bearer JWT token using asymmetric EdDSA / RS256 verification against the platform's JWKS.
   - Extracts caller identity: `userId`, `email`, `defaultWorkspaceId`.
   - Bypassed only for routes explicitly decorated with `@Public()`.
2. **`RbacGuard`:**
   - Evaluates the route's required permissions (`@Permissions(PERMISSIONS.RECRUITERS_WRITE)`).
   - Resolves the caller's active role within the target workspace from session context.
   - Rejects unauthorized invocations with `403 Forbidden` (`FORBIDDEN_INSUFFICIENT_PERMISSIONS`).
3. **`WorkspaceScopeGuard`:**
   - Enforces multi-tenant data isolation and completely eliminates BOLA vulnerabilities.
   - Extracts the requested workspace ID from Route Params (`:workspaceId`), Query Params (`?workspaceId=`), or Headers (`X-Workspace-Id`).
   - Verifies that the authenticated user possesses active membership in that specific workspace.
   - Injects the validated `workspaceId` into `request.workspaceId`.
   - All repository database operations are strictly scoped by this `workspaceId`.
   - Bypassed only for routes explicitly decorated with `@WorkspaceAgnostic()` (e.g., `/v1/auth/me`, `/v1/workspaces/create`).

### 2. Dual-Token Architecture & Cryptographic Key Management
- **Access Tokens:** Asymmetrically signed JWTs with a short 15-minute lifespan (`TTL = 900s`). Contains claims: `sub`, `email`, `workspaceId`, `roles`, `exp`, `jti`.
- **Refresh Tokens:** High-entropy (256-bit) cryptographically random strings. Only the deterministic SHA-256 hash (`crypto.createHash('sha256').update(rawToken).digest('hex')`) is stored in MongoDB.
- **Refresh Token Rotation (RTR):** Invoking `/v1/auth/refresh` invalidates the previous refresh token and issues a new token pair. If a revoked refresh token is presented, the entire token family is immediately revoked (defending against token theft).
- **Password Hashing:** Human passwords hashed using Bcrypt with a work factor of 12 rounds.

### 3. RFC 9457 Problem Details for HTTP APIs Standard
- All error responses conform to RFC 9457 (`application/problem+json`).
- Core schema members:
  - `type` (URI reference identifying the error type)
  - `title` (Human-readable classification)
  - `status` (Canonical HTTP status code)
  - `detail` (Specific explanation of the failure)
  - `instance` (Request URI)
  - `requestId` (Distributed tracing correlation ID)
  - `invalidParams` (Array/object detailing property-level schema violations)
- Internal stack traces, database error messages, and credentials are strictly stripped in production (`NODE_ENV === 'production'`).

### 4. Mass Assignment & BOPLA Mitigation
- Global `ValidationPipe` configured with `whitelist: true` and `forbidNonWhitelisted: true`.
- All mutation DTOs defined with strict Zod schemas and NestJS `class-validator` decorators. Unknown or restricted properties in request payloads trigger immediate `400 Bad Request` validation rejections.

## Rationale

- Guarantees 100% defense against cross-tenant data leakage by mathematically binding every data access query to the cryptographically verified `workspaceId`.
- Eliminates security vulnerability regressions across developer teams by enforcing guards globally at the bootstrap level rather than relying on per-controller decorator hygiene.
- Provides standard, machine-readable RFC 9457 error contracts enabling frontend clients and API consumers to programmatically handle errors without string parsing.

## Consequences

- Endpoints requiring cross-workspace administrative access must be guarded by dedicated system service accounts with explicit auditing.
- Automated tests must provide valid workspace membership context or use mock tenant factories.
- Response payload size for errors increases slightly (~120 bytes) to accommodate standard RFC 9457 metadata.
