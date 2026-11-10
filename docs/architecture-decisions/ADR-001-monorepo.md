# ADR-001: Monorepo

## Status

Accepted

## Context

The Career Intelligence OS consists of multiple applications (frontend, backend,
worker, extension) and shared packages (types, database, UI). A monorepo enables
atomic changes across boundaries, shared type safety, and simplified dependency
management.

## Decision

Use pnpm workspaces with Turborepo as the monorepo orchestration tool.

## Rationale

- pnpm provides efficient disk usage via content-addressable store.
- Turborepo provides dependency-aware task execution and caching.
- Single repository simplifies atomic refactors across FE/BE boundaries.
- Workspace dependencies are explicit and type-safe.

## Consequences

- All applications share a single lockfile (`pnpm-lock.yaml`).
- CI pipelines must be path-aware to avoid unnecessary rebuilds.
- Version alignment across packages is enforced by the workspace.
