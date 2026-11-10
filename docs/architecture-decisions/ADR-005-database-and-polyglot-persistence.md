# ADR-005: Database Selection and Polyglot Persistence Architecture

## Status

Accepted

## Context

Career Intelligence OS requires a persistent data architecture capable of supporting:
1. Core transactional workflows (multi-tenant workspace isolation, user auth, RBAC, billing, session management).
2. Dynamic, rapidly evolving company and recruiter intelligence entities with polymorphic enrichment attributes (scraped data, unstructured hiring signals, nested verification sources).
3. Ultra-fast distributed background queuing and rate-limiting (job discovery, contact verification, company research).
4. Analytical aggregation for email outreach telemetry, bounce classification, reply sentiment, and conversion tracking across millions of interactions.
5. Semantic vector search for candidate-job skill matching and resume qualification.

A single database engine cannot optimally satisfy high-frequency document mutations, ACID transactional guarantees, real-time transient queuing, sub-millisecond analytical aggregations, and high-dimensional vector similarity without severe performance degradation, write amplification, or prohibitive operational overhead.

## Decision

We adopt a **Polyglot Persistence Architecture** anchored by MongoDB 7 as the primary operational document database, complemented by specialized data stores as scale thresholds are crossed:

1. **Primary Operational OLTP (All Stages): MongoDB Atlas 7.0 (Replica Set / Sharded Cluster)**
   - Serves as the system of record for all multi-tenant entities (`Workspaces`, `Users`, `Memberships`, `Companies`, `Recruiters`, `JobPostings`, `AuditEvents`, `OutboxEvents`).
   - Leverages native JSON document flexibility for schema evolution of enrichment metadata.
   - Enforces multi-tenant isolation via mandatory `workspaceId` prefix on all collections and compound indexes.
   - Utilizes multi-document ACID transactions with `majority` write concern for cross-entity operations (e.g., workspace provisioning, membership changes, outbox dispatch).

2. **Distributed Cache, Session, & Fast Job Queuing (Stages 1–3): Redis 7.2 (Cluster)**
   - In-memory key-value cache with sub-millisecond p99 latency for session verification and rate-limiting.
   - Underpins BullMQ asynchronous job distribution (`company-research`, `contact-verification`, `job-discovery`).

3. **Time-Series Outreach & Interaction Analytics (Stage 3+ / >100k DAU): ClickHouse Cloud**
   - High-throughput columnar OLAP engine for email delivery logs, open/click beacons, bounce telemetry, and aggregate reporting.
   - Ingests events asynchronously via Kafka/Redpanda consumer pipelines, keeping analytical read queries off MongoDB Atlas primary nodes.

4. **Semantic Matching & Vector Retrieval (Stage 2+): MongoDB Atlas Vector Search / Qdrant**
   - Atlas Vector Search (integrated HNSW indexing) for initial candidate-to-job matching directly on existing collections.
   - Dedicated Qdrant cluster introduced in Stage 3 if vector search QPS exceeds 500 RPS or collection size exceeds 5M embeddings.

## Rationale

- **Schema Agility:** Recruiter profiles and company intelligence contain disparate, non-standardized schemas across research sources (LinkedIn, GitHub, Apollo, Hunter, corporate career sites). Relational engines require continuous DDL migrations or heavy JSONB joins that hinder developer velocity and index efficiency.
- **Multi-Tenant Sharding:** MongoDB provides native horizontal sharding with hashed shard keys (`{ workspaceId: "hashed", _id: 1 }`), ensuring even distribution across physical shards while eliminating cross-shard queries for tenant-scoped operations.
- **Operational Efficiency:** Consolidating initial OLTP and vector search within MongoDB Atlas reduces Day-1 infrastructure complexity, backup duplication, and cross-system sync failures until analytical and queue volumes reach dedicated service thresholds.

## Consequences

- All queries in application services must use `BaseRepository` to ensure strict `workspaceId` filtering.
- Complex analytical queries across millions of outreach events must not run against the primary MongoDB replica; they must target ClickHouse or secondary read replicas (`secondaryPreferred`).
- Schema validation must be rigorously enforced at application boundaries using Zod domain schemas and Mongoose schema definitions.
