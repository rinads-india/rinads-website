# RINADS full-platform go-live runbook

Single, sequenced runbook to take the whole RINADS platform live. It consolidates the existing checklists into one ordered path and wires in the read-only verification tooling added alongside it.

**Governance:** every production-changing action below is founder-gated per [../founder-audit/FOUNDER-SIGNOFF.md](../founder-audit/FOUNDER-SIGNOFF.md). Agents may prepare PRs, docs, and read-only checks only. Nothing in this runbook is executed automatically.

**Companion docs (authoritative detail):**

- [../founder-audit/PRODUCTION-TRUTH.md](../founder-audit/PRODUCTION-TRUTH.md) — what is BUILT/DEPLOYED vs BLOCKED
- [../founder-audit/RELEASE-ACCEPTANCE.md](../founder-audit/RELEASE-ACCEPTANCE.md) — acceptance tests
- [../founder-audit/VERCEL-CHECKLIST.md](../founder-audit/VERCEL-CHECKLIST.md) — Vercel project settings
- [RGLOW_PRODUCTION_CUTOVER.md](./RGLOW_PRODUCTION_CUTOVER.md) — R GLOW cutover + Twilio
- [../runbooks/RGLOW-COMMUNICATIONS-WORKER.md](../runbooks/RGLOW-COMMUNICATIONS-WORKER.md) — worker detail

## Read-only tooling (safe to run any time)

```bash
# Validate the current environment's contract + provider config shape (no network, no writes):
pnpm ops:preflight

# Probe live health endpoints (read-only GET); optionally probe migration sentinel tables:
pnpm ops:verify --website https://www.rinads.com --glow https://glow.rinads.com
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm ops:verify --website https://www.rinads.com
```

Neither script mutates anything, sends a message, or moves money. `verify-production` only issues health GETs and zero-row Supabase REST probes; `preflight-config` only inspects `process.env`.

## Step 1 — Supabase migrations + RLS (founder)

Migration ledger completeness is guarded in CI by `apps/website/tests/production-migration-ledger.test.ts`. Applying them to production remains manual.

- [ ] Apply all migrations in `supabase/migrations` through `20260924100000_site_leads.sql` (includes salon vertical routing `20260916100003`, loyalty expiry `20260921100000`, and `site_leads`).
- [ ] Confirm RLS is enabled on all tenant tables and policies from `20260816100001_rls_complete.sql` are present.
- [ ] Add Auth redirect allowlist entries: `https://www.rinads.com/**`, `https://rinads.com/**`, `https://glow.rinads.com/**`.
- [ ] Verify with a read-only probe: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm ops:verify` (sentinel tables `organizations`, `organization_members`, `site_leads`, `salon_loyalty_accounts`, `salon_campaigns`).

## Step 2 — Vercel env contract + settings (founder)

Per [../founder-audit/VERCEL-CHECKLIST.md](../founder-audit/VERCEL-CHECKLIST.md), on both `rinads-website` and `rinaglow` projects:

- [ ] Root Directory `apps/website` / `apps/rinaglow`; Production branch `main`; Framework Next.js.
- [ ] Env: `NEXT_PUBLIC_AUTH_PROVIDER=supabase`, `USE_SUPABASE=1`, `USE_DEMO_STORE=0`, Supabase URL/anon/service-role.
- [ ] Env: `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.rinads.com` (bare leading-dot; no scheme/path) on BOTH projects.
- [ ] Env: `NEXT_PUBLIC_RINAGLOW_URL=https://glow.rinads.com`.
- [ ] Confirm both `/api/health` return `productionEnvContract: ok` (use `pnpm ops:verify`).

`pnpm ops:preflight` validates exactly these keys against whatever environment it runs in (e.g. a `vercel env pull` dump), and fails only on the hard env contract.

## Step 3 — Authenticated E2E smoke (founder + agent)

Requires three test personas (non-salon member, salon member, no-membership). Specs live in `tests/e2e/auth.spec.ts` and auto-skip unless `E2E_BASE_URL` and the `E2E_*` credentials are set. Cover the [../founder-audit/RELEASE-ACCEPTANCE.md](../founder-audit/RELEASE-ACCEPTANCE.md) matrix:

- [ ] `/os` requires session; anonymous → login.
- [ ] Salon member signs in at `www` → redirected to `https://glow.rinads.com/...` without a second login (shared `.rinads.com` cookie).
- [ ] Non-salon member stays in `/os`; no-membership → onboarding; multi-org without active org stays `/os`.
- [ ] Client role cannot see Money/billing bridges (UI) AND cannot hit owner-portal billing APIs (server RBAC/RLS).
- [ ] Lead form submission persists a row in `site_leads` (service role / webhook path).

## Step 4 — Twilio WhatsApp (founder)

Secrets on Edge Function / scheduler only — never `NEXT_PUBLIC_`. `pnpm ops:preflight` reports readiness and fails if any secret is exposed to the browser.

- [ ] Start with sandbox credentials: `RINADS_TWILIO_SID`, `RINADS_TWILIO_TOKEN`, `RINADS_TWILIO_WHATSAPP_FROM`.
- [ ] Complete sender registration + approved templates; set status callback `<SUPABASE_URL>/functions/v1/notify-whatsapp-webhook`.
- [ ] Verify webhook signature validation rejects bad signatures; verify consent/opt-out suppression.
- [ ] Send one allowlisted test; confirm outbox transitions `sent → delivered → read` (or `failed`). Without secrets, `notify-whatsapp` returns `not_configured` — never a fake `sent`.
- [ ] Rotate sandbox credentials before production traffic.

## Step 5 — Communications worker (founder)

Off by default. `scripts/cron/communications-worker.ts` refuses to run unless enabled and authenticated.

- [ ] Set `RINADS_COMMUNICATIONS_WORKER_ENABLED=1`, `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, `RINADS_CRON_SECRET=RINADS_CRON_INVOCATION_TOKEN`, and an explicit `RINADS_COMMUNICATIONS_ORGANIZATION_IDS` allowlist.
- [ ] Validate shape first: `RINADS_COMMUNICATIONS_WORKER_ENABLED=1 ... pnpm ops:preflight`.
- [ ] Run one tick for one staging org; confirm only approved + due campaigns advance.

## Step 6 — Razorpay billing (founder)

- [ ] Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` (browser checkout).
- [ ] Configure webhook `<SUPABASE_URL>/functions/v1/payment-webhook`; verify signature handling.
- [ ] Run one live payment/subscription E2E. Stripe remains `NOT_IMPLEMENTED` by design.

## Step 7 — Optional cron scaffolds (agent PR, founder enable)

`health-check` and `morning-digest` Edge Functions are implemented but disabled by default:

- [ ] `RINADS_HEALTH_CHECK_ENABLED=1` to compute `organization_health_scores` (model in `supabase/functions/_shared/health-score.ts`).
- [ ] `RINADS_MORNING_DIGEST_ENABLED=1` to write `notification_outbox` digest items (builder in `supabase/functions/_shared/morning-digest.ts`).

Both return `{status:"disabled"}` until enabled and never fabricate data.

## Step 8 — Commercial / legal hygiene (founder + counsel)

- [ ] Replace `AwaitingCounselNotice` legal shells with counsel-approved copy.
- [ ] Only publish verified case studies / logos / numeric pricing (never invent — enforced by `apps/website/tests/commercial-readiness.test.ts`).
- [ ] Run Lighthouse/a11y on a preview URL and record real scores:
      `npx lighthouse https://<preview-url> --only-categories=performance,accessibility,seo --chrome-flags="--headless=new --no-sandbox"`.

## Acceptance

A slice is "commercially usable" only when: production SHA known + health PASS; relevant migrations verified applied; auth/tenancy smoke PASS for that slice's personas; no fabricated claims; and founder has signed [../founder-audit/FOUNDER-SIGNOFF.md](../founder-audit/FOUNDER-SIGNOFF.md) for any send/worker/migrate action.
