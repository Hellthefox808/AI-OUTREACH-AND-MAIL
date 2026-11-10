# CI/CD

## Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci-fe.yml` | Push/PR to main | Frontend typecheck, lint, build, test |
| `ci-be.yml` | Push/PR to main | Backend typecheck, lint, build, test (with MongoDB + Redis services) |
| `ci-shared.yml` | Push/PR to main | Shared packages typecheck, build |
| `security-scan.yml` | Push, PR, schedule | Dependency audit, secret scanning |
| `dependency-review.yml` | PR to main | Dependency change review |

## Path-Aware Execution

CI workflows only run when relevant paths change (e.g. `apps/fe/**` triggers FE CI).
This avoids unnecessary builds of unrelated applications.

## Deployment

Deployment workflows (`deploy-fe.yml`, `deploy-be.yml`, `deploy-worker.yml`,
`release-extension.yml`) are defined but require environment approval and
secret boundaries before production use.

## Secrets

- GitHub secrets used for credentials (never in job logs).
- Actions use least-privilege permissions.
- Third-party Actions pinned to commit SHAs where practical.
