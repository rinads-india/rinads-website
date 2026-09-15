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

## Production env contract (enforced, fails closed — two layers)

A misconfigured Production deploy must never silently serve demo/fabricated
data to real users. That fail-closed intent is enforced by two independent
layers, both backed by the same rule in `packages/auth/src/config.ts`: when
`VERCEL_ENV=production` (set automatically by Vercel — never set manually),
the environment must have:

- `NEXT_PUBLIC_AUTH_PROVIDER=supabase` (never `demo`)
- `USE_DEMO_STORE` unset or `0` (never `1`)

**Layer 1 — build-time gate (`next.config.ts`).** Every app's
`next.config.ts` calls `assertProductionEnvContract()` from `@rinads/auth` at
module scope. Vercel injects the real target-environment values during the
build step, so a misconfigured Production build **fails outright** — the bad
deployment never goes live at all. This is the preferred failure point: it
blocks the deploy before it can serve a single request.

**Layer 2 — runtime guard (`middleware.ts`).** Every app's `middleware.ts`
calls the non-throwing `checkProductionEnvContract()` (not the throwing
`assertProductionEnvContract()`) on every request. If it reports
`{ ok: false }`, middleware logs the violation server-side and returns a
controlled, branded `503 Service Unavailable` response
(`renderProductionEnvContractUnavailablePage()`) instead of letting an
exception escape. This layer exists for cases the build-time gate can't
catch — e.g. env vars changed after a deploy was already built and promoted,
or a build using a cached/skipped config load — and it degrades gracefully
instead of crashing.

**Health endpoint (`/api/health`).** Every app also exposes
`app/api/health/route.ts`, explicitly excluded from the middleware matcher,
so it stays reachable even when the runtime guard is 503ing every other
route. It calls `checkProductionEnvContract()` and reports
`{ status: "ok" | "degraded", checks: { productionEnvContract: "ok" | "failed" } }`
with a matching `200`/`503` status — use it for uptime monitoring to
distinguish "app is down" from "app is up but misconfigured."

A cross-app regression test
(`apps/website/tests/production-env-contract-hardening.test.ts`) statically
asserts all three of the above hold for every app, so a new app or an
accidental revert is caught in CI.

See [`.env.example`](../../.env.example) for the full list of required
production values (Supabase keys, Razorpay live keys, etc.), which must be
set in the Vercel project's **Production** environment variables, not
committed to the repo.

### Incident runbook: `MIDDLEWARE_INVOCATION_FAILED` / 500 on every request

If a live site starts 500ing on every route with Vercel's generic
`MIDDLEWARE_INVOCATION_FAILED` error page, this is very likely the Layer-2
guard's predecessor throwing (or, if this hardening has regressed, the
current guard being bypassed). Diagnose and fix:

1. **Check `/api/health` first.** It bypasses the middleware guard, so it
   should still respond even if every other route is down. `{ "status":
   "degraded", "checks": { "productionEnvContract": "failed" } }` confirms
   this is the production env contract, not an unrelated crash.
2. **Open the failing deployment's Function Logs in Vercel** and look for a
   `[production-env-contract]` log line (or, pre-hardening, a
   `ProductionEnvContractError` stack trace) — it names exactly which
   check failed.
3. **Fix the Production environment variables** in the Vercel project
   settings (not Preview/Development — they're independent):
   - `NEXT_PUBLIC_AUTH_PROVIDER` must be `supabase`
   - `USE_DEMO_STORE` must be unset or `0`
4. **Redeploy** (or use "Redeploy" on the last good build) after fixing the
   env vars — env var changes alone do not retroactively fix an already
   -built deployment; a fresh build/deploy is required to pick them up.
5. **Verify** by hitting `/api/health` (expect `200`, `status: "ok"`) and a
   real page (expect the normal app response, not a 503 or 500) on the
   custom domain, not just the `*.vercel.app` alias.
6. **After the incident**, confirm layer 1 (the `next.config.ts` build-time
   gate) is intact on the affected app — it should have caught this at
   build time and prevented the bad deploy from ever going live. If it
   didn't, that's the regression to fix, not just the env vars.
