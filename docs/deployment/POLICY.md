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

## Production env contract (enforced, fails closed)

Every app's `middleware.ts` calls `assertProductionEnvContract()` from
`@rinads/auth` (`packages/auth/src/config.ts`) on every request. When
`VERCEL_ENV=production` (set automatically by Vercel — never set manually),
it throws — and every request 500s — unless:

- `NEXT_PUBLIC_AUTH_PROVIDER=supabase` (never `demo`)
- `USE_DEMO_STORE` is unset or `0` (never `1`)

This is intentional fail-closed behavior: a misconfigured production deploy
must never silently serve demo/fabricated data to real users. See
[`.env.example`](../../.env.example) for the full list of required production
values (Supabase keys, Razorpay live keys, etc.), which must be set in the
Vercel project's **Production** environment variables, not committed to the
repo.
