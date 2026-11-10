# Testing

## Test Types

- **Unit tests**: Business rules, validation, guards, repository logic.
- **Integration tests**: MongoDB, Redis, queue processing, OAuth flows.
- **Contract tests**: OpenAPI compatibility, FE/BE contracts.
- **E2E tests**: Critical business flows (auth, company discovery, outreach).
- **Security tests**: Cross-workspace isolation, authorization, token handling.

## Test Commands

| Command | Scope |
|---------|-------|
| `pnpm run test` | All package tests |
| `pnpm --filter @career-intelligence/be test` | Backend tests |
| `pnpm --filter @career-intelligence/database test` | Database package tests |

## Writing Tests

- Mock external services (MongoDB, Redis, email providers) in unit tests.
- Use `mongodb-memory-server` or Docker Compose for integration tests.
- Test failure paths, not just success paths.
- Never assert on hardcoded fake data as if it were real.

## Coverage

Run `pnpm run test:coverage` to generate coverage reports.
