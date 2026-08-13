# Deployment Policy

**Status:** Phase 0  
**Default:** Safe CI-gated workflow  
**Direct prod CLI deploy:** EMERGENCY MODE only

## Standard workflow

```text
PR
 → CI (lint, typecheck, test, build)
 → review
 → merge
 → staging
 → verification
 → production
```

## Vercel (Public Experience)

- Project root directory: `apps/website`
- Framework: Next.js
- Install command (monorepo): `pnpm install` from repository root (configure Vercel accordingly)
- Build command: `pnpm --filter @rinads/website build` (or turbo filter)

## EMERGENCY MODE

`pnpm deploy:emergency` (formerly unguarded `deploy`) may push directly to production via Vercel CLI.

Use **only** for:

- production outage
- security hotfix
- critical deployment failure

After emergency deploy: document cause, follow with proper PR, and review.

## Phase 0 constraints

- No automatic production deploy from GitHub Actions
- Supabase is **not** live for production business data
- Demo auth is not production authentication
