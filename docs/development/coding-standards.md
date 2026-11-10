# Coding Standards

## TypeScript

- Strict mode enabled across all packages.
- `noUncheckedIndexedAccess` enabled.
- Avoid `any`; use proper types or `unknown` with validation.
- All external data validated at runtime via Zod schemas.
- No `// TODO`, `...`, or stub functions presented as complete.

## Imports

- Use workspace dependencies explicitly (e.g. `@career-intelligence/shared`).
- Never import across independent application boundaries.
- No relative imports that cross package boundaries.

## Formatting

- Prettier with print width 100, semi-colons, single quotes.
- Run `pnpm format` before committing.

## Naming

- Files: kebab-case (e.g. `auth-service.ts`).
- Classes/interfaces: PascalCase (e.g. `AuthService`).
- Functions/variables: camelCase (e.g. `validateEnv`).
- Constants: UPPER_SNAKE_CASE (e.g. `QUEUE_NAMES`).

## Error Handling

- Use `AppError` hierarchy from `@career-intelligence/shared`.
- Never log secrets, tokens, email bodies, or resume contents.
- Structured error responses via `HttpExceptionFilter`.
