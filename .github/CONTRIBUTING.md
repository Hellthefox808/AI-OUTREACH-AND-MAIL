# Contributing to Career Intelligence OS

Thank you for your interest in contributing to Career Intelligence OS! We welcome contributions from developers, researchers, and designers.

## Development Workflow

### 1. Prerequisites
- **Node.js**: `>= 20.0.0`
- **Package Manager**: `pnpm` version `9.x`
- **Docker**: For local MongoDB 7 and Redis 7 instances

### 2. Local Setup
```bash
# Clone the repository
git clone https://github.com/Hellthefox808/AI-OUTREACH-AND-MAIL.git
cd AI-OUTREACH-AND-MAIL

# Copy environment variables
cp .env.example .env

# Install monorepo dependencies
pnpm install

# Start local backing infrastructure
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

### 3. Quality Gates
Every contribution must pass the verification protocol before opening a pull request:
```bash
# 1. Strict TypeScript compilation across all 7 packages
pnpm run typecheck

# 2. Linting and formatting rules
pnpm run lint

# 3. Unit and integration test suites
pnpm run test

# 4. Production build verification
pnpm run build
```

## Branch & Commit Conventions

- Use conventional commits format:
  - `feat: <description>` (new capabilities)
  - `fix: <description>` (bug fixes)
  - `perf: <description>` (performance optimizations)
  - `refactor: <description>` (code structure changes)
  - `test: <description>` (adding or modifying tests)
  - `docs: <description>` (documentation updates)
  - `chore: <description>` (maintenance or tooling)

## Pull Request Guidelines

1. Create a descriptive feature branch (`feat/recruiter-verification`, `fix/token-rotation`).
2. Ensure zero TypeScript errors and zero test regressions.
3. Fill out the pull request template completely.
4. Maintain workspace isolation boundaries: never submit un-scoped multi-tenant database queries.
