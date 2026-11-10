# CI/CD Architecture & Pipeline Matrix

## Workflows Overview

| Workflow | File | Trigger | Purpose | Service Containers |
|---|---|---|---|---|
| **Master Monorepo CI** | `.github/workflows/ci.yml` | Push & PR to `main` (all paths) | Full monorepo validation (`typecheck`, `lint`, `test`, `build`) and 127 E2E integration tests | `mongo:7`, `redis:7-alpine` |
| **Backend & Workers CI** | `.github/workflows/ci-be.yml` | Push & PR to `main` (`apps/be/**`, `apps/worker/**`, `packages/database/**`, `packages/shared/**`, `tests/**`) | NestJS API, BullMQ Worker, Database typecheck, lint, build, unit tests, and full E2E suite | `mongo:7`, `redis:7-alpine` (with health checks) |
| **Frontend & Extension CI** | `.github/workflows/ci-fe.yml` | Push & PR to `main` (`apps/fe/**`, `apps/extension/**`, `packages/ui/**`, `packages/shared/**`) | Next.js 14, React 18, Chrome Extension MV3, UI library typecheck, lint, build, and unit tests | None (stateless) |
| **Shared Packages CI** | `.github/workflows/ci-shared.yml` | Push & PR to `main` (`packages/shared/**`, `packages/database/**`, `packages/ui/**`) | Monorepo core schemas, repositories, and UI primitives validation and build | None (stateless) |
| **Security Scanning** | `.github/workflows/security-scan.yml` | Push & PR to `main`, Daily Cron (02:00 UTC) | GitHub CodeQL SAST (`javascript-typescript`), Gitleaks full git history secret detection, and `pnpm audit` | None |
| **Dependency Review** | `.github/workflows/dependency-review.yml` | Pull requests to `main` | Automatic CVE and license compliance review via `actions/dependency-review-action@v4` | None |

## Path-Aware Execution & Monorepo Optimization

Targeted CI workflows (`ci-be.yml`, `ci-fe.yml`, `ci-shared.yml`) use granular path filtering so targeted PRs execute rapidly. Turborepo pipeline caching ensures tasks with unchanged inputs replay instantaneously from cache:

```
turbo run validate -> typecheck (cached) -> lint (cached) -> test (cached) -> build (cached)
```

The master `.github/workflows/ci.yml` runs unconditionally on all pull requests and pushes to `main`, providing canonical required status checks for GitHub Branch Protection rules without suffering from "Waiting for status" hangs caused by skipped path filters.

## Service Containers & Health Probing

Backend and E2E test workflows spin up isolated ephemeral services:
- **MongoDB 7**: Health-checked via `mongosh --eval 'db.adminCommand("ping")'` (interval: 10s, timeout: 5s, retries: 5).
- **Redis 7 Alpine**: Health-checked via `redis-cli ping` (interval: 10s, timeout: 5s, retries: 5).

## Secrets & Least Privilege Security

- Workflows declare explicit least-privilege `permissions` blocks (`contents: read`, `security-events: write`, `pull-requests: write`).
- No long-lived credentials or tokens are printed to runner logs. High-entropy API tokens are tested only against mocked and ephemeral local harnesses.
