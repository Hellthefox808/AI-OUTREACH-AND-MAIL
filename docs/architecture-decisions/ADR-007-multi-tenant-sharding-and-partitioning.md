# ADR-007: Multi-Tenant Sharding and Partitioning Strategy

## Status

Accepted

## Context

At 1,000,000 registered users (~100,000 active workspaces), aggregate operational data reaches multi-terabyte scale:
- 10M+ company profiles.
- 50M+ recruiter contacts.
- 25M+ job postings.
- 500M+ outreach logs and audit events.

A single MongoDB replica set encounters physical limits in RAM, IOPS, and network throughput when active dataset size exceeds the wiredTiger buffer cache. We need a horizontal sharding architecture that guarantees:
1. Strict multi-tenant data isolation.
2. Even data distribution across shards without hot-spotting large enterprise tenants.
3. Elimination of cross-shard "scatter-gather" queries for standard user dashboard and workflow operations.
4. Predictable rebalancing and linear capacity scaling.

## Decision

We adopt a **Compound Hashed Sharding Architecture** for multi-tenant collections:

1. **Shard Key Selection:**
   - For tenant-scoped collections (`Companies`, `Recruiters`, `JobPostings`, `AuditEvents`, `OutboxEvents`), the compound shard key is:
     `{ workspaceId: "hashed", _id: 1 }`
   - For global/auth collections (`Workspaces`, `Users`, `Sessions`, `Memberships`):
     Unsharded primary replica set (anchored on primary shard `shard-01`) or sharded by `{ _id: "hashed" }` as user volume exceeds 10M documents.

2. **Tenant Placement & Hot-Tenant Isolation:**
   - Hashed prefix (`workspaceId: "hashed"`) guarantees uniform distribution of workspaces across all available physical shards, preventing cluster imbalance.
   - Secondary component (`_id: 1`) preserves chunk localization and prevents chunk splits from scattering single documents across multiple shards.
   - For top-tier enterprise workspaces generating >5% of aggregate cluster traffic, MongoDB Atlas **Zone Sharding** (Tiered Tagged Shards) is utilized to dedicate isolated hardware shards to specific enterprise `workspaceId` ranges.

3. **Query Routing Guardrails:**
   - All read and write queries originating from `apps/be` must supply `workspaceId` in the query predicate (enforced globally by `BaseRepository`).
   - The MongoDB query router (`mongos`) uses the `workspaceId` hash to route targeted queries directly to a single shard, completely preventing expensive scatter-gather operations across the cluster.
   - Cross-workspace queries (strictly restricted to system administrative scripts and global migrations) must be executed off-peak and explicitly budgeted.

## Rationale

- Ranged sharding on `workspaceId` causes monotonically increasing tenant hot spots and uneven chunk sizes.
- Hashed sharding ensures pseudo-random, uniform distribution of tenants across all shards while preserving targeted single-shard routing for any query containing `workspaceId`.
- Eliminating scatter-gather queries maintains p95 query latency under 25ms regardless of cluster size.

## Consequences

- Unique indexes across collections must include the shard key (`workspaceId`) as a prefix (which already complies with our tenancy security rules: `{ workspaceId: 1, domain: 1 }`, `{ workspaceId: 1, email: 1 }`).
- Multi-document transactions are optimal when all documents in the transaction share the same `workspaceId` (single-shard transaction). Cross-workspace transactions become distributed two-phase commits and are strictly forbidden by architectural policy.
