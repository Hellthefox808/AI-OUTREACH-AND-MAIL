# Career Intelligence OS

[![CI - Frontend](https://github.com/Hellthefox808/AI-OUTREACH-AND-MAIL/actions/workflows/ci-fe.yml/badge.svg)](https://github.com/Hellthefox808/AI-OUTREACH-AND-MAIL/actions/workflows/ci-fe.yml)
[![CI - Backend](https://github.com/Hellthefox808/AI-OUTREACH-AND-MAIL/actions/workflows/ci-be.yml/badge.svg)](https://github.com/Hellthefox808/AI-OUTREACH-AND-MAIL/actions/workflows/ci-be.yml)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-5.5_Strict-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14_App_Router-000000?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-ea2845?logo=nestjs)](https://nestjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?logo=redis)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Enterprise-grade Career Intelligence, Company Research, Recruiter Discovery, Opportunity Mapping, and Automated Outbound Intelligence Platform.**

Built with an **Apple-inspired Spatial Glassmorphism & 4D Motion Engine**, strict multi-tenant workspace isolation, deterministic cryptographic token security, and distributed BullMQ asynchronous queue orchestration.

---

## 1. System Topology & Architecture

Career Intelligence OS is engineered as an enterprise-grade monorepo managed with **pnpm 9** and **Turborepo**, ensuring deterministic dependency isolation and zero runtime leaks.

```
                           ┌─────────────────────────────────────────┐
                           │        apps/fe: Next.js 14 App          │
                           │   Spatial Glassmorphism + 4D Engine     │
                           └────────────────────┬────────────────────┘
                                                │ HTTPS / REST (/v1/*)
                                                ▼
┌───────────────────────────┐    ┌─────────────────────────────────────────┐    ┌───────────────────────────┐
│  apps/extension: Chrome   │───▶│       apps/be: NestJS Core API          │◀───│   Cloud Integrations      │
│     Manifest V3 Ext       │    │   Auth, RBAC, Multi-Tenant Invariants   │    │  (Google, MS Graph, S3)   │
└───────────────────────────┘    └──────────────┬──────────────────┬───────┘    └───────────────────────────┘
                                                │                  │
                                                ▼                  ▼
                                 ┌────────────────────────┐ ┌───────────────┐
                                 │  MongoDB Atlas / MDB7  │ │  Redis 7 /    │
                                 │ (Tenancy Repositories) │ │ BullMQ Queues │
                                 └────────────────────────┘ └───────┬───────┘
                                                                    │
                                                                    ▼
                                                 ┌─────────────────────────────────────┐
                                                 │      apps/worker: NestJS Worker     │
                                                 │   (Distributed Queue Processors)    │
                                                 └─────────────────────────────────────┘
```

---

## 2. Spatial UI/UX & 4D Motion Engine

The user interface implements an Apple-inspired spatial computing aesthetic that balances physical realism with performance and WCAG 2.2 AA accessibility:

- **Refined Glassmorphism**: Controlled material tiers (`ambient`, `frosted`, `crystal`, `dark`, `solid`) with specular rim lighting, saturated translucency (`backdrop-blur-xl`), and graceful fallbacks for browsers lacking backdrop-filter support.
- **4D Particle Engine $(X, Y, Z, T)$**: A lightweight Canvas 2D spatial environment simulating horizontal and vertical drift ($X, Y$), perceived depth parallax ($Z \in [0.2, 1.0]$), and time-dependent harmonic wave propagation ($T$) with pointer proximity repulsion and Page Visibility API sleep throttling.
- **Hierarchical Depth Layers**:
  - `Layer 0`: Deep obsidian environment mesh (`#080a0f`) with radial illumination.
  - `Layer 1`: Background 4D particle constellation.
  - `Layer 2`: Primary navigation shell, ambient glass header, and frosted sidebar.
  - `Layer 3`: Interactive frosted data tables and spatial KPI cards with sparklines.
  - `Layer 4`: Contextual floating tools and micro-pill tabs.
  - `Layer 5`: Elevated crystal modal dialogs with keyboard focus traps and backdrop blur.
- **Motion Tokens**: Centralized durations (`instant: 100ms`, `micro: 160ms`, `standard: 220ms`, `smooth: 320ms`, `spatial: 450ms`, `cinematic: 650ms`) with full `@media (prefers-reduced-motion)` pause compliance.

---

## 3. Core Implemented Capabilities

### 🏢 Target Company Intelligence
- Workspace-scoped employer directory and legal entity tracking.
- Domain validation, tier classification (`TIER_1`, `TIER_2`, `TIER_3`), and industry categorization.
- Synchronized with background research queues for organizational mapping.

### 👥 Recruiter Discovery & Email Verification
- Talent acquisition contact registry with designation, team, and work email indexing.
- Multi-stage asynchronous verification pipeline:
  - Syntax compliance validation.
  - MX host and disposable domain detection (`mailinator`, `tempmail`, etc.).
  - Verification state scoring: `VERIFIED`, `SYNTAX_VALID`, `DOMAIN_VALID`, `RISKY`, `INVALID`.

### 💼 Requisition & Job Opportunity Tracking
- Real-time job requisition catalog mapped to company entities.
- Work mode classification (`REMOTE`, `HYBRID`, `ONSITE`) and role type tracking (`FULL_TIME`, `CONTRACT`).
- Direct application links and outbound recruitment readiness indicators.

### ⚡ Distributed Worker Orchestration (BullMQ)
- Isolated asynchronous execution worker (`apps/worker`).
- Idempotency guarantees on job execution with progress reporting.
- High-throughput processors for company research, contact verification, and job discovery.

---

## 4. Repository Structure & Boundaries

```
career-intelligence-os/
│
├── apps/
│   ├── fe/                  # Next.js 14 App Router, React 18, Tailwind CSS, Spatial Glassmorphism
│   ├── be/                  # NestJS Core API, Auth, RBAC, Domain Services, Swagger OpenAPI
│   ├── worker/              # BullMQ distributed queue processors (isolated execution unit)
│   └── extension/           # Chrome Manifest V3 extension (options, popup, sidepanel)
│
├── packages/
│   ├── database/            # Mongoose schemas, indexes, BaseRepository, DatabaseModule
│   ├── shared/              # Domain schemas (Zod), branded IDs, permissions, errors
│   └── ui/                  # Reusable spatial components (Cards, Modals, Tables, Particles, Buttons)
│
├── infrastructure/
│   └── docker/              # Local Docker Compose configurations (MongoDB 7 & Redis 7)
│
├── docs/                    # Architecture records, threat models, testing guides
├── tests/                   # Monorepo E2E and integration suites
└── .github/                 # CI/CD Workflows, security policies, issue templates
```

---

## 5. Security & DevSecOps Invariants

1. **Workspace Isolation**: Every persistence query is pinned to a validated `workspaceId`. Un-scoped queries against multi-tenant collections are prohibited by `BaseRepository`.
2. **Identity & Token Integrity**:
   - High-entropy tokens (session hashes, refresh token hashes, password reset tokens) are stored and queried using deterministic SHA-256 hashes (`crypto.createHash('sha256')`).
   - Bcrypt with 12 salt rounds is strictly enforced for human password hashing.
   - Access tokens are short-lived (15 minutes). Refresh tokens rotate on every renewal.
3. **Guard Architecture**: `AuthGuard`, `RbacGuard`, and `WorkspaceScopeGuard` are registered globally as `APP_GUARD`. Unauthenticated endpoints are explicitly decorated with `@Public()`.
4. **CSRF Mitigation**: Double-submit cookie verification pattern (`csrf_token`) enforced for state-changing browser sessions.
5. **Brute-Force Lockout**: 5 consecutive failed authentications trigger an automatic 15-minute account lock.
6. **Zero-Placeholder Guarantee**: All production code is fully implemented, strictly typed, and verified with zero stubs or mock bypasses.

---

## 6. Getting Started

### Prerequisites
- **Node.js**: `>= 20.0.0`
- **pnpm**: `9.x` (`npm install -g pnpm@9`)
- **Docker & Docker Compose**: For local MongoDB 7 and Redis 7 backing services

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/Hellthefox808/AI-OUTREACH-AND-MAIL.git
cd AI-OUTREACH-AND-MAIL

# 2. Configure environment variables
cp .env.example .env

# 3. Install workspace dependencies
pnpm install

# 4. Start backing databases (MongoDB 7 & Redis 7)
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 5. Run full verification protocol
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build

# 6. Start development servers in parallel
pnpm run dev
```

### Access Points
- **Frontend Dashboard**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000` (or `http://localhost:3001` based on port config)
- **Swagger Documentation**: `http://localhost:4000/api/docs`

---

## 7. Operational Scripts Reference

| Command | Purpose |
|---|---|
| `pnpm run dev` | Launch all monorepo applications in parallel |
| `pnpm run dev:fe` | Launch Next.js 14 frontend only |
| `pnpm run dev:be` | Launch NestJS backend API only |
| `pnpm run dev:worker` | Launch BullMQ worker processor only |
| `pnpm run typecheck` | Strict TypeScript compilation across all 7 packages |
| `pnpm run lint` | ESLint static analysis and auto-fixing |
| `pnpm run test` | Run Vitest unit & integration test suites |
| `pnpm run build` | Full production build of all applications and packages |
| `pnpm run validate` | Comprehensive CI quality gate (`typecheck` + `lint` + `test`) |

---

## 8. Core API Specification (`/v1/*`)

### Authentication & Sessions
- `POST /v1/auth/register` — Register user, provision workspace, and issue session.
- `POST /v1/auth/login` — Authenticate credentials, set HTTP-only cookies, and return Bearer token.
- `POST /v1/auth/logout` — Revoke active session via SHA-256 hash lookup and clear cookies.
- `POST /v1/auth/refresh` — Rotate access and refresh token pair.
- `POST /v1/auth/mfa/enroll` — Generate TOTP QR code and secret for authenticator apps.
- `POST /v1/auth/mfa/verify` — Confirm TOTP verification code to enable MFA.
- `GET /v1/auth/me` — Inspect authenticated session identity and workspace permissions.

### Workspaces
- `GET /v1/workspaces` — List workspaces accessible to current user.
- `POST /v1/workspaces` — Provision a new workspace tenant and seed default roles/permissions.
- `GET /v1/workspaces/:workspaceId` — Retrieve workspace settings and members.

### Companies Intelligence
- `GET /v1/companies` — List companies for active workspace (cursor pagination supported).
- `POST /v1/companies` — Register target company and domain profile.
- `GET /v1/companies/:id` — Retrieve company dossier and industry tags.
- `PATCH /v1/companies/:id` — Update company profile or tier.
- `DELETE /v1/companies/:id` — Soft-delete company record.

### Recruiters Intelligence
- `GET /v1/recruiters` — List verified talent acquisition contacts.
- `POST /v1/recruiters` — Add recruiter and enqueue background email verification.
- `GET /v1/recruiters/:id` — Retrieve recruiter dossier and delivery status.
- `PATCH /v1/recruiters/:id` — Update contact information.
- `DELETE /v1/recruiters/:id` — Soft-delete recruiter record.

### Jobs Intelligence
- `GET /v1/jobs` — List active requisitions with work mode and status filters.
- `POST /v1/jobs` — Create new career opening record.
- `GET /v1/jobs/:id` — Retrieve job posting details.
- `PATCH /v1/jobs/:id` — Update job status or application link.
- `DELETE /v1/jobs/:id` — Soft-delete job record.

---

## 9. Contributing & Community Guidelines

Contributions are welcomed! Please read our [Contributing Guidelines](.github/CONTRIBUTING.md) and [Security Policy](.github/SECURITY.md) before submitting pull requests.

1. Fork the project and create a feature branch (`git checkout -b feat/spatial-metric-cards`).
2. Verify all quality gates pass: `pnpm run validate && pnpm run build`.
3. Commit using conventional commit format: `feat: add spatial metric cards`.
4. Push to your branch and open a Pull Request.

---

## 10. License

This project is licensed under the terms of the [MIT License](LICENSE).
