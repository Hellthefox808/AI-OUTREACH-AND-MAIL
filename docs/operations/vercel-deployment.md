# Vercel Deployment Guide — Career Intelligence OS
## Production Monorepo Deployment for Next.js 14 App Router (`apps/fe`)

This guide establishes the production deployment procedure for the **Career Intelligence OS** frontend web application on Vercel from the GitHub repository (`https://github.com/Hellthefox808/AI-OUTREACH-AND-MAIL`).

---

## 1. Architecture & Monorepo Topology

```
Repository Root (Turborepo + pnpm workspace)
├── apps/
│   ├── fe/           <-- Target Vercel Deployment Unit (Next.js 14)
│   ├── be/           <-- Backend NestJS API (Deploy to Cloud Run / Railway / Docker)
│   ├── worker/       <-- BullMQ Background Job Processor
│   └── extension/    <-- Chrome Extension Manifest V3
└── packages/
    ├── database/     <-- Mongoose Schemas & Repositories
    ├── shared/       <-- Zod Contracts, Types & Schemas
    └── ui/           <-- Shared Spatial Glass Design System Primitives
```

Because `apps/fe` relies on internal workspace dependencies (`@career-intelligence/shared` and `@career-intelligence/ui`), Vercel must build `apps/fe` with awareness of the monorepo root.

---

## 2. Option 1: Vercel Dashboard (Recommended Git-Connected CI/CD)

### Step 1: Import GitHub Repository
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Select your repository: `Hellthefox808/AI-OUTREACH-AND-MAIL`.

### Step 2: Configure Project Settings
In the Project Configuration screen:

| Setting | Value | Explanation |
| :--- | :--- | :--- |
| **Project Name** | `career-intelligence-fe` | Identifies the deployment in your Vercel team |
| **Framework Preset** | `Next.js` | Vercel automatically detects Next.js 14 App Router |
| **Root Directory** | `apps/fe` | **Critical**: Tells Vercel where the web application lives |

### Step 3: Build & Development Settings
Click to expand **Build and Output Settings**:

- **Build Command**: Toggle Override -> `cd ../.. && pnpm turbo run build --filter=@career-intelligence/fe` *(or leave default if Vercel automatically detects Turborepo)*.
- **Output Directory**: `.next` (default).
- **Install Command**: `pnpm install` (default).

### Step 4: Environment Variables
Add the following production environment variable:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com` | Base URL of your deployed NestJS backend API |

### Step 5: Deploy
Click **Deploy**. Vercel will install dependencies, build the `@career-intelligence/ui` and `@career-intelligence/shared` packages, and deploy the 9 prerendered static pages to Vercel's global Edge network.

---

## 3. Option 2: Deploying via Vercel CLI

Ensure you have Vercel CLI installed and authenticated:

```bash
# 1. Login to Vercel
npx vercel login

# 2. Deploy preview build from the apps/fe directory
cd apps/fe
npx vercel

# 3. Deploy to production
npx vercel --prod
```

When prompted by the CLI:
- `Set up and deploy?` -> `yes`
- `Which scope?` -> Select your team/account
- `Link to existing project?` -> `no` (or select if already created)
- `What's your project's name?` -> `career-intelligence-fe`
- `In which directory is your code located?` -> `./`

---

## 4. Post-Deployment Backend CORS Synchronization

Once your Vercel deployment URL is generated (e.g., `https://career-intelligence-fe.vercel.app` or custom domain `https://app.yourdomain.com`), configure your NestJS backend (`apps/be`) to permit credentials from this origin:

In your backend `.env` (or cloud hosting environment settings):
```bash
ALLOWED_ORIGINS=https://career-intelligence-fe.vercel.app,https://app.yourdomain.com
```

This guarantees secure double-submit CSRF cookie passing and authenticated Bearer/Session JWT communication.
