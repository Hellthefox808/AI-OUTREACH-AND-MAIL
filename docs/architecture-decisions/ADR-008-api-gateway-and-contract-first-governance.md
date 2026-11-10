# ADR-008: API Gateway Topology, Multi-Protocol Routing & Contract-First Governance

## Status

Accepted

## Context

Career Intelligence OS coordinates diverse API consumer tiers:
1. **Private Single-Page Application (`apps/fe`):** Interactive React 18 / Next.js 14 client requiring low-latency hydration, server-side filtering, and real-time AI analytics.
2. **Chrome Extension (`apps/extension`):** Manifest V3 background service workers and sidepanel requiring high-frequency contact ingestion, DOM capture payloads, and offline queue syncing.
3. **Internal Microservices & Workers (`apps/worker`):** BullMQ queue consumers, enrichment processors, and data pipelines requiring low-overhead, high-throughput RPC.
4. **Third-Party Partner & Developer APIs:** Enterprise ATS/CRM integrations (Greenhouse, Lever, Salesforce, HubSpot) requiring predictable, versioned REST/JSON interfaces.
5. **AI Agent & MCP Tool Execution APIs:** Dynamic LLM tool discovery and execution conforming to the Model Context Protocol (MCP) JSON-RPC 2.0.

Without a centralized ingress API Gateway and strict contract-first governance:
- Node.js application pods become saturated performing non-business compute (TLS handshake termination, DDoS rate limiting, static asset handling).
- API contracts drift between backend implementations, frontend SDKs, and external consumer documentation.
- Breaking changes inadvertently slip into production without deprecation notices.

## Decision

We establish a **Dual-Layer Edge & Ingress API Gateway Topology** paired with **OpenAPI 3.1 Contract-First Governance**:

### 1. Dual-Layer Edge & Ingress Topology
- **Layer 1 (Global Edge):** Cloudflare Enterprise Anycast network provides Edge DDoS mitigation, TLS 1.3 termination, Web Application Firewall (WAF) rule sets, and bot score verification.
- **Layer 2 (Ingress API Gateway):** Envoy Proxy 1.28+ (or declarative Kong 3.x) deployed at the Kubernetes cluster perimeter handles:
  - Mutual TLS (mTLS) upstream verification from Cloudflare Origin CA.
  - Global sliding-window rate limiting backed by Redis.
  - HTTP/2 multiplexing, connection pooling, and circuit breaking (`max_connections: 10000`, `consecutive_5xx: 5`).
  - Request ID injection (`X-Request-Id`) and W3C TraceContext propagation (`traceparent`).
  - Dynamic CORS header evaluation for authorized dashboard domains and Chrome Extension origins.

### 2. Multi-Protocol Service Mapping
- **External Public & Web APIs:** Resource-oriented REST over HTTP/2 with JSON payloads and Keyset pagination.
- **Internal Service-to-Service RPC:** High-throughput binary gRPC with Protocol Buffers v3 for worker-to-backend communication.
- **Real-Time Pipeline Updates:** Server-Sent Events (SSE) over persistent HTTP/2 streams for streaming queue progress and LLM responses.
- **Asynchronous Integrations:** Webhooks governed by AsyncAPI 3.0 contracts and backed by the Transactional Outbox pattern.

### 3. Contract-First Specification & Automated SDK Pipeline
- **Single Source of Truth:** OpenAPI 3.1 specifications auto-generated from NestJS Swagger decorators and validated against Spectral linting rules (`spectral:oas3`).
- **Drift Prevention:** CI/CD pipeline runs `pnpm run verify:contracts` on every pull request, comparing git HEAD OpenAPI schemas against the published registry.
- **Automated Client SDK Generation:** Typed SDK clients (`@career-intelligence/sdk-ts`, `@career-intelligence/sdk-py`) generated via OpenAPI Generator, ensuring compile-time contract adherence across monorepo packages.

## Rationale

- Offloads connection termination and rate limiting from Node.js single-threaded event loops to C++ Envoy cores, saving ~35% backend CPU overhead.
- Protects downstream microservices from cascading failures via upstream circuit breaking and outlier node ejection.
- Guarantees zero contract drift between the NestJS implementation, OpenAPI specification, and TypeScript/Python client libraries.

## Consequences

- Gateway configurations (`envoy.yaml`, `kong.yaml`) must be maintained in infrastructure-as-code and kept in sync with route additions.
- Local development requires running Envoy or relying on the built-in NestJS rate limiter and middleware fallbacks when running without Docker.
- Breaking schema changes require a formal 6-month deprecation lifecycle using RFC 8594 `Deprecation` and `Sunset` HTTP headers.
