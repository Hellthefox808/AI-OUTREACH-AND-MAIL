# ADR-006: Transactional Outbox Pattern and Event Streaming Architecture

## Status

Accepted

## Context

Career Intelligence OS coordinates asynchronous multi-stage pipelines:
1. Recruiter discovery triggers email pattern resolution.
2. Email verification triggers job matching and outreach queue ingestion.
3. Outreach approval triggers email dispatch via SMTP/SES/SendGrid.
4. Outbound delivery triggers inbox polling, reply categorization, and webhook web events.

Directly publishing events to message queues (Redis BullMQ or Kafka) inside application HTTP request handlers creates dual-write vulnerabilities. If MongoDB commits a recruiter insertion but the Redis network write fails (or vice versa), data becomes permanently inconsistent. Furthermore, distributed transactions across MongoDB and external brokers are anti-patterns that induce high latency and cascading failures.

## Decision

We implement the **Transactional Outbox Pattern** combined with **Change Data Capture (CDC)**:

1. **Transactional Outbox Collection (`OutboxEvents`):**
   - Every domain mutation requiring asynchronous processing writes both the domain entity and an `OutboxEvent` document within the *same* MongoDB multi-document ACID transaction.
   - The outbox document captures: `_id`, `workspaceId`, `eventType`, `aggregateType`, `aggregateId`, `payload`, `status` (`PENDING`, `PUBLISHED`, `FAILED`), `retryCount`, `createdAt`, `lockedAt`, and `processedAt`.

2. **Event Dispatch Mechanism:**
   - **Stages 1–2 (BullMQ + Redis 7):** A high-frequency Outbox Poller / Change Stream listener running in `apps/worker` tails the `OutboxEvents` collection using MongoDB Change Streams (`watch()`). Upon detecting a new outbox entry, it enqueues a job into BullMQ with an idempotency key (`idempotencyKey = event._id.toString()`) and marks the outbox event as `PUBLISHED`.
   - **Stages 3–4 (Kafka / Redpanda):** Debezium MongoDB CDC Connector or native Kafka Connect tails MongoDB replica set oplog directly, streaming outbox events to Kafka topics partitioned by `workspaceId`.

3. **Message Guarantees & Idempotency:**
   - Transport delivers **at-least-once** semantics.
   - Downstream consumers in `apps/worker` must implement **idempotent message processing** using Redis distributed locks and atomic status checks before executing external side effects (e.g., sending emails or charging credits).
   - Failed jobs are retired with exponential backoff and jitter, moving to a Dead Letter Queue (DLQ) after 5 failed attempts.

## Rationale

- Eliminates dual-write anomalies and race conditions between DB persistence and message publishing.
- Guarantees zero data loss even if Redis, worker nodes, or external networks crash during API execution.
- Decouples API latency from downstream pipeline execution time (p95 API response times remain < 50ms).

## Consequences

- Domain write operations require slightly higher write volume in MongoDB due to outbox document creation.
- A background retention task must clean up `PUBLISHED` outbox events older than 7 days using MongoDB TTL indexes.
- All worker job handlers must enforce strict idempotency checks using unique job keys.
