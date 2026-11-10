# Career Intelligence OS

[![CI - Frontend](https://github.com/Hellthefox808/AI-OUTREACH-AND-MAIL/actions/workflows/ci-fe.yml/badge.svg)](https://github.com/Hellthefox808/AI-OUTREACH-AND-MAIL/actions/workflows/ci-fe.yml)
[![CI - Backend](https://github.com/Hellthefox808/AI-OUTREACH-AND-MAIL/actions/workflows/ci-be.yml/badge.svg)](https://github.com/Hellthefox808/AI-OUTREACH-AND-MAIL/actions/workflows/ci-be.yml)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-5.5_Strict-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14_App_Router-000000?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-ea2845?logo=nestjs)](https://nestjs.com/)
[![MongoDB 7](https://img.shields.io/badge/MongoDB-7.0_ACID-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Redis 7](https://img.shields.io/badge/Redis-7.0_Cluster-DC382D?logo=redis)](https://redis.io/)
[![Envoy Ingress](https://img.shields.io/badge/Envoy-1.28_mTLS-f69220?logo=envoyproxy)](https://www.envoyproxy.io/)
[![Tests Passing](https://img.shields.io/badge/Tests-186_Passed_(100%25)-brightgreen.svg)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Enterprise Career Intelligence, Target Company Research, Recruiter Discovery, Opportunity Mapping, and Automated Outbound Intelligence Platform.**

Engineered for **1,000,000+ users** with an **Apple-inspired Spatial Glassmorphism & 4D Motion Engine**, strict multi-tenant workspace isolation (`workspaceId`), deterministic cryptographic token security, distributed BullMQ asynchronous queue orchestration, RFC 9457 Problem Details error contracts, and declarative Envoy/Kong ingress gateways.

---

## Table of Contents

1. [System Architecture & Topology](#1-system-architecture--topology)
2. [End-to-End System Workflows](#2-end-to-end-system-workflows)
   - [2.1 Candidate Discovery & Outbox Pipeline Workflow](#21-candidate-discovery--outbox-pipeline-workflow)
   - [2.2 Zero-Trust Authentication & Token Rotation Lifecycle](#22-zero-trust-authentication--token-rotation-lifecycle)
   - [2.3 Distributed Idempotency Key State Machine](#23-distributed-idempotency-key-state-machine)
   - [2.4 Durable Webhook Delivery Pipeline](#24-durable-webhook-delivery-pipeline)
   - [2.5 AI Data Chat & Real-Time Analytics Engine](#25-ai-data-chat--real-time-analytics-engine)
3. [Spatial UI/UX & 4D Motion Engine](#3-spatial-uiux--4d-motion-engine)
4. [Monorepo Directory Layout & Boundaries](#4-monorepo-directory-layout--boundaries)
5. [Enterprise API Specification (`/v1/*`)](#5-enterprise-api-specification-v1)
6. [Architecture Decision Records (ADRs)](#6-architecture-decision-records-adrs)
7. [Security & DevSecOps Invariants](#7-security--devsecops-invariants)
8. [Getting Started & Local Setup](#8-getting-started--local-setup)
9. [Verification & Testing Protocol](#9-verification--testing-protocol)
10. [Operational Scripts Reference](#10-operational-scripts-reference)
11. [Contributing & Community Guidelines](#11-contributing--community-guidelines)
12. [License](#12-license)

---

## 1. System Architecture & Topology

Career Intelligence OS is structured as a high-concurrency monorepo powered by **pnpm 9** and **Turborepo**. The dual-layer ingress topology decouples global edge security from internal application compute:

```mermaid
flowchart TD
    subgraph Clients["Client Tier"]
        FE["Browser Web App\n(Next.js 14 App Router)"]
        EXT["Chrome Extension\n(Manifest V3 Sidepanel)"]
        PARTNER["External ATS / Partners\n(Greenhouse, Lever, HubSpot)"]
    end

    subgraph Edge["Global Edge Tier"]
        CF["Cloudflare Enterprise Edge\n(Anycast DNS • Edge DDoS • WAF • Bot Protection)"]
    end

    subgraph Gateway["Ingress Gateway Tier"]
        ENVOY["Envoy 1.28+ / Kong 3.x Gateway\n(mTLS • Sliding-Window Rate Limit • Correlation ID • Circuit Breakers)"]
    end

    subgraph AppTier["Compute & Domain Services"]
        BE["NestJS Monolith API (:4000)\n(AuthGuard • RbacGuard • WorkspaceScopeGuard • RFC 9457)"]
        WORKER["NestJS Worker Pool (BullMQ)\n(Contact Verification • Research Scraper • Outbox Dispatcher)"]
    end

    subgraph Persistence["Storage & State Infrastructure"]
        MDB[("MongoDB 7 Replica Set\n(Multi-Document ACID • OutboxEvents • Sharded Collections)")]
        REDIS[("Redis 7 In-Memory Cluster\n(BullMQ Queues • Idempotency Leases • Session Hashes)")]
    end

    FE -->|HTTPS / REST| CF
    EXT -->|REST / JSON| CF
    PARTNER -->|OAuth2 / REST| CF

    CF -->|TLS 1.3 / mTLS| ENVOY
    ENVOY -->|HTTP/2 / Route Rewrite| BE
    ENVOY -.->|gRPC / Internal Mesh| WORKER

    BE -->|Read / Write ACID| MDB
    BE -->|Sliding-Window Lua / Locks| REDIS
    BE -->|Enqueue Jobs| REDIS

    WORKER -->|Consume Jobs| REDIS
    WORKER -->|CDC / Tail Outbox| MDB
    WORKER -->|Update Enrichment Data| MDB
```

---

## 2. End-to-End System Workflows

### 2.1 Candidate Discovery & Outbox Pipeline Workflow

Mutations that trigger asynchronous background enrichment (email verification, company research, ATS export) utilize the **Transactional Outbox Pattern** to prevent dual-write inconsistencies:

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter as Talent Lead / Recruiter
    participant Ext as Chrome MV3 Extension
    participant API as NestJS Backend API (/v1/*)
    participant MDB as MongoDB 7 (ACID Transaction)
    participant Worker as Background Worker (BullMQ)
    participant Svc as Verification & Enrichment Engine

    Recruiter->>Ext: Select Candidate Profile on LinkedIn / Job Board
    Ext->>API: POST /v1/recruiters (Idempotency-Key: idemp-...)
    Note over API: Idempotency Interceptor checks Redis lease lock
    API->>MDB: Session.withTransaction()
    MDB->>MDB: 1. Insert Recruiter Document (status: PENDING)
    MDB->>MDB: 2. Insert OutboxEvent (eventType: RECRUITER_DISCOVERED)
    MDB-->>API: Commit Transaction
    API-->>Ext: 201 Created (Recruiter Record + Idempotent response)

    par Asynchronous Processing
        Worker->>MDB: Tail / Poll OutboxEvents (status: PENDING)
        Worker->>Worker: Enqueue BullMQ Job (contact-verification)
        Worker->>Svc: Verify SMTP MX Host & Syntax Deliverability
        Svc-->>Worker: Status: VERIFIED (Score: 98.4%)
        Worker->>MDB: Update Recruiter (status: VERIFIED, email: clean)
        Worker->>MDB: Mark OutboxEvent (status: PUBLISHED)
    end
```

---

### 2.2 Zero-Trust Authentication & Token Rotation Lifecycle

Human sessions utilize **Short-Lived Asymmetric JWTs** combined with **Opaque Refresh Tokens** that rotate deterministically on every refresh invocation:

```mermaid
flowchart TD
    A["POST /v1/auth/login\n(email, password)"] --> B["Bcrypt Hash Verification\n(12 Salt Rounds)"]
    B -->|Valid Credentials| C["Generate Token Pair"]
    B -->|Invalid Credentials| D["Increment Failed Attempts\n(5 Failures = 15m Lockout)"]

    C --> E["Access Token: JWT (15-min TTL)\n(Signed with EdDSA / RS256)"]
    C --> F["Refresh Token: 256-bit Random Hex\n(SHA-256 Hash stored in MongoDB)"]

    E & F --> G["Set HttpOnly, Secure, SameSite=Strict Cookies\n+ CSRF Double-Submit Cookie"]

    G --> H["Client makes authenticated calls\n(/v1/workspaces, /v1/recruiters)"]
    H --> I["Access Token Expires (15 min)"]

    I --> J["POST /v1/auth/refresh\n(Present Refresh Token)"]
    J --> K["Hash Token via SHA-256 &\nQuery Sessions Collection"]

    K -->|Active Token Match| L["Rotate Tokens:\n1. Revoke Old Token Hash\n2. Issue New Refresh Token Hash\n3. Issue New 15-min JWT"]
    K -->|Revoked / Reused Token!| M["🚨 Token Family Theft Detected!\nRevoke ALL sessions for User across all devices"]
```

---

### 2.3 Distributed Idempotency Key State Machine

Mutating HTTP operations (`POST`, `PUT`, `PATCH`, `DELETE`) pass through the `IdempotencyInterceptor` adhering to IETF draft standards:

```mermaid
stateDiagram-v2
    [*] --> CheckHeader: Mutating HTTP Request (POST/PATCH/DELETE)

    CheckHeader --> PassThrough: No Idempotency-Key provided
    CheckHeader --> ValidateKey: Idempotency-Key present

    ValidateKey --> KeyMalformed: Length < 8 or > 256
    KeyMalformed --> [*]: 422 Unprocessable Entity

    ValidateKey --> CheckRedis: Compute Body SHA-256 Fingerprint

    CheckRedis --> Miss: Key Not Found
    CheckRedis --> InFlight: Key Status = PENDING
    CheckRedis --> Completed: Key Status = COMPLETED

    InFlight --> [*]: 409 Conflict (IDEMPOTENCY_IN_FLIGHT)

    Completed --> PayloadMatch: Compare SHA-256 Fingerprints
    PayloadMatch --> ReturnCached: Match == true
    PayloadMatch --> PayloadMismatch: Match == false

    PayloadMismatch --> [*]: 422 Unprocessable Entity (IDEMPOTENCY_PAYLOAD_MISMATCH)
    ReturnCached --> [*]: Replay Cached Body (Idempotent-Replayed: true)

    Miss --> AcquireLock: SET NX PX 60000 (Status: PENDING)
    AcquireLock --> ExecuteHandler: Run Business Controller

    ExecuteHandler --> HandlerSuccess: Handler Resolves
    ExecuteHandler --> HandlerError: Handler Rejects / Throws

    HandlerSuccess --> CacheResult: Store Body, Status, Headers (TTL: 24h)
    CacheResult --> [*]: Return 201/200 Response

    HandlerError --> EvictLock: Delete PENDING Lock
    EvictLock --> [*]: Propagate Exception (Allows immediate clean retry)
```

---

### 2.4 Durable Webhook Delivery Pipeline

Outbound webhooks notify external partner systems (Greenhouse, Lever, HubSpot) with cryptographic tamper-proofing and automated backoff retries:

```mermaid
flowchart LR
    OUTBOX["MongoDB\nOutboxEvents"] -->|CDC / Watch| STREAM["Worker Dispatcher\n(BullMQ)"]
    STREAM --> SIGN["Compute HMAC-SHA256\n(Secret, Timestamp + Payload)"]
    SIGN --> DISPATCH["HTTP POST Dispatch\nX-Signature-SHA256\nX-Timestamp\nX-Event-ID"]

    DISPATCH -->|2xx Success| SUCCESS["Mark Event\nPUBLISHED"]
    DISPATCH -->|4xx / 5xx / Timeout| RETRY["Exponential Backoff with Full Jitter\n(1m, 5m, 15m, 1h, 6h, 24h)"]

    RETRY -->|Retry Limit Exceeded (7 attempts)| DLQ["Dead Letter Queue (DLQ)\n(Incident Diagnostic Logged)"]
    DLQ -->|50 Continuous Failures| SUSPEND["Auto-Suspend Endpoint\n(Admin Alert Dispatched)"]
```

---

### 2.5 AI Data Chat & Real-Time Analytics Engine

The platform features an embedded natural language query engine (`POST /v1/analytics/chat`) and interactive slide-out drawer for instant organizational intelligence:

```mermaid
flowchart TD
    USER["User asks question in UI\n('Show active hiring tech companies in Tier 1')"] --> DRAWER["DataChatDrawer\n(Spatial React Slide-out)"]
    DRAWER --> API["POST /v1/analytics/chat\n(X-Workspace-Id scoped)"]
    API --> SERVICE["AnalyticsService.chat()"]

    SERVICE --> INTENT["Parse Intent & Entity Keywords\n(Companies, Recruiters, Jobs, Tiers, Work Modes)"]
    INTENT --> REPO["Query Workspace Repositories\n(getMetrics, getIndustryBreakdown, getSkillBreakdown)"]
    REPO --> AGG["Aggregate Real-Time Workspace State"]

    AGG --> FORMAT["Generate Structured Reply\nMarkdown KPI Analysis + Suggested Query Chips"]
    FORMAT --> RESP["HTTP 200 JSON Response"]
    RESP --> RENDER["Dynamic UI Rendering\nInteractive Query Chips + Reasoning Accordion"]
```

---

## 3. Spatial UI/UX & 4D Motion Engine

The interface implements an Apple-inspired spatial computing design language balancing aesthetic depth with WCAG 2.2 AA accessibility and 60fps rendering:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Layer 5: Elevated Crystal Modals & Focus Traps (z-50)                  │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 4: Contextual Floating Floating Action Pills & Tooltips (z-40)   │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 3: Interactive Frosted Glass Cards, KPI Sparks & Tables (z-30)   │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 2: Ambient Glass Shell, Frosted Sidebar & App Header (z-20)     │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 1: 4D Particle Constellation Engine (Canvas 2D / Parallax) (z-10)│
├────────────────────────────────────────────────────────────────────────┤
│ Layer 0: Obsidian Ground Mesh (#080a0f) + Specular Radial Light (z-0)  │
└────────────────────────────────────────────────────────────────────────┘
```

- **Material Tiers**: `ambient` (navigation backdrop), `frosted` (data tables), `crystal` (interactive cards with specular borders), and `dark` (drawers).
- **4D Particle Engine $(X, Y, Z, T)$**: Canvas 2D simulation calculating lateral drift ($X, Y$), perspective depth parallax ($Z \in [0.2, 1.0]$), and harmonic wave oscillation over time ($T$), with pointer repulsion and Page Visibility API sleep throttling.
- **Micro-Interaction Tokens**: Durations calibrated across `instant: 100ms`, `micro: 160ms`, `standard: 220ms`, `smooth: 320ms`, `spatial: 450ms`, and `cinematic: 650ms`, with full `@media (prefers-reduced-motion)` pause enforcement.

---

## 4. Monorepo Directory Layout & Boundaries

```
career-intelligence-os/
│
├── apps/
│   ├── fe/                  # Next.js 14 App Router, React 18, Tailwind UI, Spatial Glassmorphism
│   │   ├── src/app/         # Dashboard, Companies, Recruiters, Jobs, Auth routes
│   │   ├── src/components/  # Spatial Cards, Modals, Tables, Particles, DataChatDrawer
│   │   └── src/lib/         # Typed API Client SDK with credentials & error mapping
│   │
│   ├── be/                  # NestJS Core API Modular Monolith
│   │   ├── src/common/      # AuthGuard, RbacGuard, WorkspaceScopeGuard, RFC 9457 Filter, Idempotency
│   │   └── src/modules/     # Auth, Workspaces, Users, Companies, Recruiters, Jobs, Analytics, Outbox
│   │
│   ├── worker/              # BullMQ distributed queue processors (isolated execution unit)
│   │   └── src/modules/     # CompanyResearchProcessor, ContactVerificationProcessor, JobDiscovery
│   │
│   └── extension/           # Chrome Manifest V3 Extension (Sidepanel, Popup, Background Worker)
│
├── packages/
│   ├── database/            # Mongoose schemas, compound indexes, BaseRepository, DatabaseModule
│   ├── shared/              # Domain schemas (Zod), branded IDs, permissions, RFC 9457 errors
│   └── ui/                  # Reusable UI primitives (Button, Input, Card, Modal, Badge, Table)
│
├── infrastructure/
│   ├── docker/              # Local Docker Compose manifests (MongoDB 7 & Redis 7)
│   └── gateway/             # Ingress configurations (envoy.yaml, kong.yaml)
│
├── docs/                    # Architecture documentation & ADR index
│   ├── architecture/        # Database & Scalability, Enterprise API Engineering, Boundaries
│   └── architecture-decisions/ # ADR-001 through ADR-010
│
├── tests/                   # Monorepo E2E and integration suites
│   ├── e2e/tier1-features/  # Auth, Companies, Recruiters, Jobs, Workspaces, Health, Workers
│   ├── e2e/tier2-boundaries/# Security, Tenancy, Pagination, Auth Boundaries
│   ├── e2e/tier3-combinations/ # Cross-Feature Integration Combinations
│   └── e2e/tier4-scenarios/ # Enterprise Real-World High-Scale Scenarios
│
└── .github/                 # Workflows (ci-fe.yml, ci-be.yml), Security Policy, Issue Templates
```

---

## 5. Enterprise API Specification (`/v1/*`)

All REST endpoints adhere strictly to **RFC 9457 Problem Details** (`application/problem+json`), enforce **Keyset Pagination**, and support the IETF `Idempotency-Key` header on mutating operations.

### Endpoints Inventory

| Method | Endpoint | Description | Permissions Required |
|---|---|---|---|
| `POST` | `/v1/auth/register` | Register new user & bootstrap workspace | `@Public()` |
| `POST` | `/v1/auth/login` | Authenticate & issue dual-token cookies | `@Public()` |
| `POST` | `/v1/auth/refresh` | Rotate access & refresh token pair | `@Public()` |
| `POST` | `/v1/auth/logout` | Revoke active session via SHA-256 hash | Authenticated |
| `GET` | `/v1/auth/me` | Retrieve authenticated profile & roles | `@WorkspaceAgnostic()` |
| `GET` | `/v1/workspaces` | List accessible workspace tenants | Authenticated |
| `POST` | `/v1/workspaces` | Provision new workspace & seed RBAC roles | Authenticated |
| `GET` | `/v1/companies` | List companies with multi-filter & cursor | `COMPANIES_READ` |
| `POST` | `/v1/companies` | Create target company profile | `COMPANIES_WRITE` |
| `GET` | `/v1/companies/export` | Export companies to CSV or JSON format | `COMPANIES_READ` |
| `GET` | `/v1/companies/:id` | Retrieve company dossier & metadata | `COMPANIES_READ` |
| `PATCH` | `/v1/companies/:id` | Update company profile details | `COMPANIES_WRITE` |
| `DELETE` | `/v1/companies/:id` | Soft-delete company record | `COMPANIES_WRITE` |
| `GET` | `/v1/recruiters` | List talent contacts with deliverability score | `RECRUITERS_READ` |
| `POST` | `/v1/recruiters` | Add recruiter & trigger verification worker | `RECRUITERS_WRITE` |
| `GET` | `/v1/recruiters/export`| Export recruiters to CSV or JSON format | `RECRUITERS_READ` |
| `GET` | `/v1/recruiters/:id` | Retrieve recruiter profile & verification state | `RECRUITERS_READ` |
| `PATCH` | `/v1/recruiters/:id` | Update contact information | `RECRUITERS_WRITE` |
| `DELETE` | `/v1/recruiters/:id` | Soft-delete recruiter record | `RECRUITERS_WRITE` |
| `GET` | `/v1/jobs` | List job requisitions with work mode filter | `JOBS_READ` |
| `POST` | `/v1/jobs` | Create new job posting | `JOBS_WRITE` |
| `GET` | `/v1/jobs/export` | Export job postings to CSV or JSON format | `JOBS_READ` |
| `GET` | `/v1/jobs/:id` | Retrieve job requisition details | `JOBS_READ` |
| `PATCH` | `/v1/jobs/:id` | Update requisition status or URL | `JOBS_WRITE` |
| `DELETE` | `/v1/jobs/:id` | Soft-delete job record | `JOBS_WRITE` |
| `GET` | `/v1/analytics/overview`| Retrieve aggregated workspace KPIs | `ANALYTICS_READ` |
| `GET` | `/v1/analytics/breakdown`| Sector heatmap, deliverability, skills | `ANALYTICS_READ` |
| `POST` | `/v1/analytics/chat` | Natural language analytics AI assistant | `ANALYTICS_READ` |
| `GET` | `/v1/health` | Service liveness, readiness, and DB ping | `@Public()` |

---

## 6. Architecture Decision Records (ADRs)

Key architectural decisions are preserved in formal records:

| ADR | Title | Decision Summary | Status |
|---|---|---|---|
| [**ADR-001**](docs/architecture-decisions/ADR-001-monorepo.md) | Turborepo Monorepo Architecture | Monorepo structure with pnpm workspaces for strict boundary enforcement | Accepted |
| [**ADR-002**](docs/architecture-decisions/ADR-002-package-management.md) | Package Management Strategy | Deterministic package management using pnpm 9 lockfile integrity | Accepted |
| [**ADR-003**](docs/architecture-decisions/ADR-003-application-boundaries.md) | Monorepo Application Boundaries | Direct database access restricted to backend; frontend and extension mediate via REST | Accepted |
| [**ADR-004**](docs/architecture-decisions/ADR-004-deployment-strategy.md) | Container Deployment Strategy | Production multi-stage Docker builds deploying independent services | Accepted |
| [**ADR-005**](docs/architecture-decisions/ADR-005-database-and-polyglot-persistence.md) | Polyglot Persistence Architecture | MongoDB 7 for transactional documents; Redis 7 for cache, locks, and queues | Accepted |
| [**ADR-006**](docs/architecture-decisions/ADR-006-transactional-outbox-and-event-streaming.md) | Transactional Outbox Pattern | ACID multi-document transactions emit OutboxEvents to prevent dual-writes | Accepted |
| [**ADR-007**](docs/architecture-decisions/ADR-007-multi-tenant-sharding-and-partitioning.md) | Multi-Tenant Sharding Strategy | Compound B-tree indexes prefixed by `workspaceId` for total tenant isolation | Accepted |
| [**ADR-008**](docs/architecture-decisions/ADR-008-api-gateway-and-contract-first-governance.md) | API Gateway & Contract Governance | Dual-layer edge (Cloudflare) + Ingress (Envoy/Kong) with OpenAPI 3.1 & Spectral | Accepted |
| [**ADR-009**](docs/architecture-decisions/ADR-009-idempotency-and-webhook-delivery-pipeline.md) | Idempotency & Webhook Pipeline | IETF `Idempotency-Key` distributed state machine + HMAC-SHA256 durable webhooks | Accepted |
| [**ADR-010**](docs/architecture-decisions/ADR-010-api-security-and-zero-trust-authorization.md) | Zero-Trust API Security & RFC 9457 | Global guard chain (`Auth`, `Rbac`, `WorkspaceScope`) + RFC 9457 error contracts | Accepted |

---

## 7. Security & DevSecOps Invariants

1. **Workspace Boundary Invariant**: Every database query is mathematically scoped to `{ workspaceId: request.workspaceId }`. Cross-tenant lookups (BOLA / IDOR) are rejected by global guards before controller execution.
2. **Token Integrity**: High-entropy tokens (session hashes, refresh hashes, password reset tokens) are stored exclusively as deterministic **SHA-256 hex digests**. Raw tokens are never persisted in plaintext.
3. **Password Security**: Passwords hashed with **Bcrypt (12 rounds)**. 5 consecutive invalid login attempts trigger an automatic 15-minute account lockout.
4. **RFC 9457 Problem Details**: Standardized error payloads (`type`, `title`, `status`, `detail`, `instance`, `requestId`) protect internal stack traces and topologies in production.
5. **SSRF Defense**: External webhook dispatchers validate target IPs against RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`) and cloud metadata endpoints (`169.254.169.254`).
6. **Zero-Placeholder Law**: All deliverables are complete, production-hardened, and typed with zero `// TODO`, `...`, or stub implementations.

---

## 8. Getting Started & Local Setup

### Prerequisites
- **Node.js**: `>= 20.0.0`
- **pnpm**: `9.x` (`npm install -g pnpm@9`)
- **Docker & Docker Compose**: For local MongoDB 7 and Redis 7 instances

### Step-by-Step Local Deployment

```bash
# 1. Clone repository
git clone https://github.com/Hellthefox808/AI-OUTREACH-AND-MAIL.git
cd AI-OUTREACH-AND-MAIL

# 2. Configure environment variables
cp .env.example .env

# 3. Install dependencies across all packages
pnpm install

# 4. Start backing databases via Docker Compose
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 5. Run the complete quality verification protocol
pnpm run validate
pnpm run test:e2e

# 6. Launch all applications in parallel development mode
pnpm run dev
```

### Access Points
- **Web Dashboard**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000/v1`
- **OpenAPI Swagger UI**: `http://localhost:4000/docs`
- **MongoDB Health**: `http://localhost:4000/v1/health`

---

## 9. Verification & Testing Protocol

The codebase includes comprehensive unit, integration, boundary, and scenario test suites:

```bash
# Execute unit test suites across all 5 testable packages (59 tests)
pnpm run test

# Execute complete End-to-End test matrix (127 tests)
pnpm run test:e2e

# Strict TypeScript typechecking across all 7 monorepo packages
pnpm run typecheck

# Full production build of Next.js, NestJS backend, and worker
pnpm run build
```

### Test Suite Distribution

| Category | Suite Path | Tests | Coverage Scope |
|---|---|:---:|---|
| **Tier 1: Features** | `tests/e2e/tier1-features/` | 77 | Auth, Companies, Recruiters, Jobs, Workspaces, Health, Workers |
| **Tier 2: Boundaries** | `tests/e2e/tier2-boundaries/` | 40 | Security, Multi-Tenancy BOLA, Keyset Pagination, Auth Guard |
| **Tier 3: Combinations**| `tests/e2e/tier3-combinations/` | 6 | Cross-Feature Interoperability & Lifecycle Cascades |
| **Tier 4: Scenarios** | `tests/e2e/tier4-scenarios/` | 4 | Enterprise High-Scale Pagination & Threat Incident Simulation |
| **Monorepo Units** | `apps/*/src/**/*.spec.ts` | 59 | Guards, Interceptors, Filters, Services, Frontend API SDK |
| **Total Test Suite** | — | **186** | **100% Green (Zero Failures)** |

---

## 10. Operational Scripts Reference

| Command | Action |
|---|---|
| `pnpm run dev` | Launch all monorepo applications in parallel via Turborepo |
| `pnpm run dev:fe` | Launch Next.js 14 frontend application only (`:3000`) |
| `pnpm run dev:be` | Launch NestJS core backend API only (`:4000`) |
| `pnpm run dev:worker` | Launch BullMQ worker processor only |
| `pnpm run dev:extension` | Launch Chrome Extension build in watch mode |
| `pnpm run typecheck` | Run strict `tsc --noEmit` across all 7 packages |
| `pnpm run lint` | Run ESLint with auto-fixing across monorepo |
| `pnpm run test` | Run Vitest unit & integration test suites |
| `pnpm run test:e2e` | Run Vitest multi-tier end-to-end test suite |
| `pnpm run build` | Compile optimized production build artifacts for all packages |
| `pnpm run validate` | Execute CI quality gate: `typecheck && lint && test` |

---

## 11. Contributing & Community Guidelines

We welcome engineering contributions! Please review our [Contributing Guidelines](.github/CONTRIBUTING.md) and [Security Policy](.github/SECURITY.md) prior to submitting pull requests.

1. Create a feature branch: `git checkout -b feat/my-enhancement`.
2. Ensure all quality gates pass: `pnpm run validate && pnpm run test:e2e && pnpm run build`.
3. Commit using conventional commit format: `feat(api): add webhook subscription endpoints`.
4. Push to remote and open a Pull Request.

---

## 12. License

This repository is licensed under the terms of the [MIT License](LICENSE).
