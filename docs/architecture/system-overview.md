# System Overview

Career Intelligence OS is a Career Intelligence, Company Research, Recruitment Intelligence,
Opportunity Discovery and Personalized Outreach Automation Platform.

## Core Pipeline

RESEARCH → COMPANY DISCOVERY → COMPANY CLASSIFICATION → RECRUITER DISCOVERY →
CONTACT EVIDENCE → EMAIL VERIFICATION → JOB MATCHING → CONTENT PERSONALIZATION →
HUMAN APPROVAL → EMAIL DELIVERY → INBOX SYNCHRONIZATION → REPLY CLASSIFICATION →
FOLLOW-UP CONTROL → INTERVIEW TRACKING → ANALYTICS → CONTINUOUS IMPROVEMENT

## Application Boundaries

| Application | Responsibility | Deployment |
|-------------|---------------|------------|
| `apps/fe` | Next.js frontend (Vercel) | Independent Vercel project |
| `apps/be` | NestJS backend — owns API + AUTH boundaries | AWS ECS Fargate |
| `apps/worker` | BullMQ background job processing | AWS ECS Fargate (independent service) |
| `apps/extension` | Chrome Manifest V3 extension | Local install / Chrome Web Store |

## Data Flow

1. FE communicates with BE via versioned REST API (`/v1/*`).
2. BE owns all domain logic, authorization, and MongoDB access.
3. FE and extension never connect directly to MongoDB.
4. Worker consumes BullMQ queues via Redis for async workloads.
5. Extension communicates with BE through authenticated API calls.

## Database

MongoDB Atlas is the central operational database. All data is workspace-scoped.
Documents and resumes are stored in private S3 with metadata in MongoDB.

## Security

- Application authentication (OIDC/sessions) is separate from mailbox authorization (OAuth).
- Refresh tokens stored HTTP-only, never in frontend localStorage or extension storage.
- Workspace isolation enforced at the repository layer.
- Default-deny authorization on all protected routes.
