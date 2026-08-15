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

Full checklist: [`VERCEL_PUBLIC_EXPERIENCE.md`](./VERCEL_PUBLIC_EXPERIENCE.md).

- Project root directory: `apps/website` (required after monorepo move)
- Framework: Next.js
- Install / build: committed in [`apps/website/vercel.json`](../../apps/website/vercel.json) (`pnpm install --filter @rinads/website...`, `pnpm --filter @rinads/website build` from monorepo root)
- Production branch: `main`
- Canonical host: `www.rinads.com` (not a team SSO / per-deployment `*.vercel.app` alias)

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
