# Dependency Boundaries

## Rules

1. **FE** may import UI, API client, shared contracts, and safe common utilities.
   - Must NOT import BE implementation.
   - Must NOT import database internals.
   - Must NOT access MongoDB directly.

2. **BE** owns domain services, authorization, and business rules.
   - Uses database through defined repository boundaries.
   - Does NOT depend on FE implementation.

3. **Worker** consumes defined domain commands and events.
   - Uses approved infrastructure adapters.
   - Must NOT duplicate backend business rules.

4. **Extension** uses public API contracts and extension SDK.
   - Must NOT import backend internals.
   - Must NOT contain service credentials.

5. **Shared packages** expose intentional public APIs.
   - Must NOT create dependency cycles.
   - Must NOT become containers for unrelated code.

## Enforcement

These boundaries are enforced by:
- Package `exports` fields limiting public surface.
- TypeScript path mappings in each app's tsconfig.
- ESLint import rules (configured per application).
- CI dependency-review workflow.

## Current Dependency Graph

```
@career-intelligence/shared  ←  @career-intelligence/database
                                          ↓
                              @career-intelligence/be
                                          ↓
                              @career-intelligence/worker
                              @career-intelligence/fe
                              @career-intelligence/ui
```
