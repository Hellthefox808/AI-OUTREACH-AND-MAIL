# Deployment

## Environments

- Local: Docker Compose (MongoDB + Redis)
- Development: Feature branch previews
- Staging: Production-like environment for validation
- Production: Live user traffic

## Backend

Deployed to AWS ECS Fargate as a Docker container.
Built from `apps/be/Dockerfile`.

## Worker

Deployed to AWS ECS Fargate as an independent service.
Built from `apps/worker/Dockerfile`.

## Frontend

Deployed to Vercel with production and preview environments.

## Extension

Built as a versioned Chrome Web Store package.

## Infrastructure

Managed via Terraform:
- Networking, security groups, ECS, ECR, ALB
- IAM roles, Secrets Manager, KMS, S3
- CloudWatch monitoring, backup configuration

## Rollback

Revert to previous Docker image tag via ECS service update.
Database migrations are backward compatible; rollback restores prior code version.
