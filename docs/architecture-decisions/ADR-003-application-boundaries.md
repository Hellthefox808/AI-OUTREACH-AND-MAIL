# ADR-003: Application Boundaries

## Status

Accepted

## Context

FE, BE, API, AUTH, and EXTENSION must remain separately deployable units.
API and AUTH initially live inside the NestJS backend deployment but maintain
distinct module ownership.

## Decision

- FE: Next.js frontend, independent Vercel deployment.
- BE: NestJS backend owning API, AUTH, domain logic, and business rules.
- Worker: Separate NestJS deployment for BullMQ job processing.
- Extension: Chrome Manifest V3, independently packaged.
- API and AUTH contracts are separate modules within BE, extractable later.

## Rationale

- Avoids premature microservices complexity.
- Maintains clean dependency boundaries without operational overhead.
- Allows independent scaling of worker vs API when needed.

## Consequences

- BE imports must not cross into FE implementation.
- Extension must not contain service credentials.
- Worker must not duplicate backend business rules.
