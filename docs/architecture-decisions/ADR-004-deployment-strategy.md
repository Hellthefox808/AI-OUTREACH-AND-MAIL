# ADR-004: Deployment Strategy

## Status

Accepted

## Context

The platform needs independent deployment pipelines for FE, BE, worker, and
extension, with environment separation (local, development, preview, staging,
production).

## Decision

- FE: Vercel (production + preview environments).
- BE: AWS ECS Fargate with Docker containers.
- Worker: AWS ECS Fargate (independent service, queue-driven scaling).
- Database: MongoDB Atlas (TLS, least-privilege users, network allowlisting).
- Cache/Queue: Managed Redis (TLS, restricted network access).
- Storage: Private AWS S3 (signed URLs, encryption).
- Secrets: AWS Secrets Manager + AWS KMS.
- Infrastructure: Terraform.

## Rationale

- Vercel provides zero-config frontend deployment with previews.
- ECS Fargate offers serverless containers with independent scaling.
- MongoDB Atlas is a managed database with backup and monitoring.
- Terraform enables infrastructure as code with plan review.

## Consequences

- No production deployment during foundation work.
- Terraform plan review required before applying infrastructure changes.
- Development, staging, and production environments are isolated.
