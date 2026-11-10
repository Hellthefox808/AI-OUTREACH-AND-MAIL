# ADR-009: Distributed Idempotency Engine & Transactional Outbox Webhook Delivery Pipeline

## Status

Accepted

## Context

In an enterprise recruitment and outbound communication platform, API calls trigger critical side effects:
- Charging user search credits upon candidate enrichment.
- Creating job postings and publishing listings to syndication feeds.
- Dispatching email outreach sequences and scheduling follow-up cadences.
- Triggering external ATS candidate imports.

Under unreliable network conditions (client timeout, packet drop, connection reset), client applications (such as automated scripts, webhook consumers, or the Chrome Extension) will retry HTTP requests. Without strict distributed idempotency guarantees:
- Users may be billed multiple times for the same candidate discovery.
- Duplicate jobs, outreach sequences, or candidates are created in the database.
- External webhook consumers receive duplicated or out-of-order events.

Conversely, outbound webhooks dispatched to third-party endpoints (e.g., notifying customer HRIS systems of a verified candidate) must withstand partner server downtime, network timeouts, and SSL handshake failures without dropping events.

## Decision

We establish an end-to-end **Distributed Idempotency Engine** for inbound mutations and a **Transactional Outbox Webhook Delivery Pipeline** for outbound events:

### 1. Inbound Distributed Idempotency Engine
- **Standard Protocol:** Adhere to the IETF draft `Idempotency-Key` HTTP header specification (`Idempotency-Key` or `X-Idempotency-Key`).
- **Scope & Isolation:** Idempotency keys are strictly scoped by workspace:
  $$\text{Cache Key} = \text{idempotency}:\{\text{workspaceId}\}:\{\text{HTTP Method}\}:\{\text{Request Path}\}:\{\text{Idempotency-Key}\}$$
- **Payload Verification:** Generate a deterministic SHA-256 fingerprint over the serialized request body (`crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex')`).
- **Distributed State Machine:**
  1. *PENDING:* Key leased atomically in Redis (`SET key record NX PX 60000`). If a second request arrives while the first is pending, the gateway rejects with `409 Conflict` and RFC 9457 error code `IDEMPOTENCY_IN_FLIGHT`.
  2. *COMPLETED:* Upon successful handler resolution, the status code, response headers, and response body are cached for 24 hours (`RECORD_TTL = 86400s`).
  3. *PAYLOAD MISMATCH:* If a completed key is replayed with a differing SHA-256 fingerprint, the request fails immediately with `422 Unprocessable Entity` (`IDEMPOTENCY_PAYLOAD_MISMATCH`).
  4. *REPLAY:* Matching keys return the cached payload with status code, injecting `Idempotent-Replayed: true` and `X-Cache-Lookup: HIT`.
  5. *ERROR RELEASE:* If the handler throws an unexpected exception, the pending lock is released immediately to allow the client to retry.

### 2. Transactional Outbox Webhook Delivery Pipeline
- **Transactional Ingestion:** Outbound events are written to the `OutboxEvents` MongoDB collection within the same ACID transaction as the triggering domain entity update.
- **CDC / Polling Ingestion:** Dedicated outbox workers in `apps/worker` stream pending outbox events into the BullMQ `webhook-dispatch` queue.
- **Cryptographic Request Signing:** Each webhook HTTP request includes an HMAC-SHA256 signature in the `X-Signature-SHA256` header:
  $$\text{Signature} = \text{HMAC-SHA256}(\text{endpointSecret}, \text{timestamp} + "." + \text{payload})$$
  along with `X-Timestamp` to defend against replay attacks (5-minute tolerance window).
- **Exponential Backoff & Full Jitter Retry Schedule:**
  - Attempt 1: Immediate.
  - Attempt 2: 1 minute.
  - Attempt 3: 5 minutes.
  - Attempt 4: 15 minutes.
  - Attempt 5: 1 hour.
  - Attempt 6: 6 hours.
  - Attempt 7: 24 hours.
  - Jitter formula: $t_{\text{sleep}} = \text{random}(0, \min(t_{\text{max}}, t_{\text{base}} \times 2^{\text{attempt}}))$.
- **Dead Letter Queue (DLQ) & Endpoint Auto-Disabling:** After 7 consecutive failed attempts, the webhook event transitions to `FAILED` in the DLQ. If an endpoint fails continuously for 50 deliveries over 24 hours, its subscription is automatically suspended and an email notification is dispatched to the workspace administrator.

## Rationale

- Guarantees at-most-once execution for mutating HTTP actions, preventing duplicate credit deductions and duplicate database entities.
- Guarantees at-least-once durable delivery for outbound webhooks with zero data loss across worker reboots or remote server outages.
- Cryptographic HMAC signatures ensure downstream consumers can mathematically verify payload authenticity and tamper-resistance.

## Consequences

- Mutating endpoints that process idempotency keys incur an initial Redis write and subsequent read (~1.5ms overhead).
- Webhook subscriptions require secret management and dashboard UI for customers to view delivery logs, test endpoints, and rotate secrets.
- Redis storage sizing must account for 24-hour idempotency payload caches (~200MB at 1M user scale).
