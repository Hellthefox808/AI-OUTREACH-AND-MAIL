# Repository Structure

```
career-intelligence-os/
├── apps/
│   ├── fe/          # Next.js frontend
│   ├── be/          # NestJS backend (API + AUTH)
│   ├── worker/      # BullMQ background worker
│   └── extension/   # Chrome Manifest V3 extension
├── packages/
│   ├── database/    # Mongoose models, repositories, indexes
│   ├── shared/      # Shared types, Zod schemas, constants
│   └── ui/          # UI primitives (cn helper)
├── content/         # Editable email templates, prompts, taxonomies
├── infrastructure/  # Docker, Terraform, AWS configs
├── tests/           # Integration, contract, e2e, security tests
├── docs/            # Architecture, development, operations docs
├── scripts/         # Helper scripts
├── .github/         # CI/CD workflows, issue templates, CODEOWNERS
├── package.json     # Root workspace manifest
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .env.example     # Environment template (no secrets)
└── README.md
```

## Workspace Dependencies

- `apps/fe` → `@career-intelligence/shared`, `@career-intelligence/ui`
- `apps/be` → `@career-intelligence/database`, `@career-intelligence/shared`
- `apps/worker` → `@career-intelligence/database`, `@career-intelligence/shared`
- `apps/extension` → no workspace deps (standalone)
- No circular dependencies between workspace packages.
