# Security & Threat Model

## 1. System Threat Landscape

Career Intelligence OS manages sensitive career data, candidate profiles, recruiter discovery information, and outreach credentials.

### Trust Boundaries
1. **Public Internet ↔ Ingress (Reverse Proxy / Load Balancer / CDN)**: TLS 1.3 termination, DDOS mitigation, global rate limiting.
2. **Client Apps (Frontend & Extension) ↔ Backend API (`apps/be`)**: Strict input validation (Zod), double-submit CSRF cookies, CORS allowlist, and short-lived JWTs.
3. **Backend API ↔ Database (MongoDB Atlas) & Cache (Redis)**: VPC-peered or private networking, least-privilege credentials, authenticated connections.
4. **Tenant ↔ Tenant**: Hard partition via mandatory `workspaceId` indexing and filtering across all Mongoose models and repositories.

## 2. Core Security Controls

| Threat Category | Potential Attack | Mitigation Strategy | Implemented Mechanism |
|---|---|---|---|
| **Broken Access Control** | Cross-tenant data exfiltration | Mandatory `workspaceId` on every model and query | `WorkspaceScopeGuard`, `BaseRepository.workspaceFilter` |
| **Authentication Failures** | Credential stuffing & brute-force | 5-attempt limit with 15m lockout | `UserRepository.lock`, bcrypt 12 salt rounds |
| **Session Hijacking** | XSS stealing session tokens | HTTP-only, SameSite cookies + Bearer auth | `AuthController.setTokenCookies`, 15m TTL |
| **Replay Attacks** | Replaying revoked refresh tokens | Single-use refresh token rotation | `AuthService.refreshTokens` revokes prior token hash |
| **Token Timing Attacks** | Slow database leaks of reset tokens | Deterministic SHA-256 token hashing | `AuthService.hashToken` (`crypto.createHash('sha256')`) |
| **Cross-Site Request Forgery** | Unauthorized browser state changes | Double-submit cookie with SameSite: Lax/Strict | `CsrfMiddleware`, `x-csrf-token` header check |
| **Injection Attacks** | NoSQL query injection / parameter tampering | Strict schema validation and sanitized casting | `ZodValidationPipe`, Mongoose cast checking |
| **Information Disclosure** | Stack trace & internals leak | Centralized exception mapping | `HttpExceptionFilter`, generic auth failure messages |

## 3. Secret Management & Compliance
- Production secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `MONGODB_URI`, `REDIS_URL`, `ENCRYPTION_MASTER_KEY`) must never be committed or hardcoded.
- Fail-fast environment validation via `apps/be/src/config/env.schema.ts` blocks startup if weak or placeholder secrets are detected in production.
- Audit logging of all identity operations (registration, login, lockout, password reset, MFA changes) via the `audit_events` collection.

