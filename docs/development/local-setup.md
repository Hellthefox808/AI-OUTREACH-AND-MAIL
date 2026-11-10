# Local Development Setup

## Prerequisites

- Node.js >= 20.0.0
- pnpm 9 (installed via Corepack or `npm install -g pnpm@9`)
- Docker and Docker Compose (for local MongoDB + Redis)

## Setup

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in required values:
   ```
   cp .env.example .env
   ```
3. Install dependencies:
   ```
   pnpm install
   ```
4. Start local infrastructure:
   ```
   docker compose -f infrastructure/docker/docker-compose.yml up -d
   ```
5. Verify typecheck:
   ```
   pnpm run typecheck
   ```
6. Run tests:
   ```
   pnpm run test
   ```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all apps in parallel |
| `pnpm dev:fe` | Start frontend only |
| `pnpm dev:be` | Start backend only |
| `pnpm dev:worker` | Start worker only |
| `pnpm build` | Build all applications |
| `pnpm lint` | Lint all applications |
| `pnpm typecheck` | TypeScript check all packages |
| `pnpm test` | Run all tests |
| `pnpm validate` | Run typecheck, lint, and tests |
| `pnpm format` | Format all files |
| `pnpm format:check` | Check formatting |
| `pnpm audit` | Run production dependency audit |

## Extension Development

1. Build the extension: `pnpm --filter @career-intelligence/extension build`
2. Load the unpacked extension in Chrome:
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select `apps/extension`

## Troubleshooting

- **MongoDB connection refused**: Ensure Docker Compose is running (`docker compose ps`).
- **TypeScript errors**: Run `pnpm run typecheck` and fix reported issues.
- **Lockfile conflicts**: Run `pnpm install` to regenerate `pnpm-lock.yaml`.
