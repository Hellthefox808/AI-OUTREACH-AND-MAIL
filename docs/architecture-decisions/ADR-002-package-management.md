# ADR-002: Package Management

## Status

Accepted

## Context

The project requires a package manager that supports workspaces, lockfile
integrity, and reproducible installs.

## Decision

Use pnpm@9 with Corepack. Lockfile committed to version control.

## Rationale

- pnpm workspaces natively support monorepo structures.
- Content-addressable store reduces disk usage and install time.
- `pnpm install --frozen-lockfile` ensures reproducible installs in CI.
- Corepack provides a documented package-manager version mechanism.

## Consequences

- `node_modules` uses symlinks rather than duplicates.
- `pnpm-lock.yaml` must be committed and kept in sync with `package.json` files.
- CI uses `pnpm install --frozen-lockfile` to prevent drift.
