# R GLOW production cutover checklist

Single go-live path for **R GLOW** (`apps/rinaglow`, host `glow.rinads.com`). Product code is MVP-complete; this checklist is ops validation only.

Companion docs:

- [VERCEL_RINAGLOW.md](./VERCEL_RINAGLOW.md) — Vercel project + cookie domain
- [../runbooks/RGLOW-COMMUNICATIONS-WORKER.md](../runbooks/RGLOW-COMMUNICATIONS-WORKER.md) — worker + Twilio detail
- [../implementation/RGLOW-MVP-CLOSURE.md](../implementation/RGLOW-MVP-CLOSURE.md) — closed operator journeys

## 1. Supabase

- [ ] Apply migrations through `20260916100003_fix_salon_vertical_routing.sql` (and any later salon migrations on `main`)
- [ ] Confirm RLS policies for salon tables on the target project
- [ ] Add Auth redirect allowlist entries:
  - `https://www.rinads.com/**`
  - `https://rinads.com/**`
  - `https://glow.rinads.com/**`
- [ ] Deploy Edge Functions: `notify-whatsapp`, `notify-whatsapp-webhook`, `payment-webhook` (as needed)

## 2. Vercel — R GLOW project

Create/verify a Vercel project with repository root `apps/rinaglow` (see `vercel.json`).

Production env:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_AUTH_PROVIDER` | `supabase` |
| `USE_SUPABASE` | `1` |
| `USE_DEMO_STORE` | `0` |
| `NEXT_PUBLIC_SUPABASE_URL` | production project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role (server only) |
| `NEXT_PUBLIC_RINAGLOW_URL` | `https://glow.rinads.com` |
| `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` | `.rinads.com` |

Also set `NEXT_PUBLIC_RINAGLOW_URL` and `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` on the **website** project.

- [ ] Point DNS `glow.rinads.com` at the Vercel project and verify the domain
- [ ] Deploy R GLOW, then website, with matching Supabase + cookie values
- [ ] Confirm `https://glow.rinads.com/api/health` reports a valid Production env contract

## 3. Auth / routing smoke

- [ ] Sign in at apex or `www` as a salon member → `/os` redirects to `https://glow.rinads.com/calendar` without a second login
- [ ] Non-salon account stays in `/os`
- [ ] No-membership account enters onboarding
- [ ] Multi-org without active selection stays in `/os`

## 4. Twilio WhatsApp

Secrets on Edge Function / scheduler only (never `NEXT_PUBLIC_`):

- `RINADS_TWILIO_SID`
- `RINADS_TWILIO_TOKEN`
- `RINADS_TWILIO_WHATSAPP_FROM`

- [ ] Start with non-production / sandbox credentials
- [ ] Complete WhatsApp sender registration + approved templates
- [ ] Status callback: `<SUPABASE_URL>/functions/v1/notify-whatsapp-webhook`
- [ ] Confirm signature validation rejects bad signatures
- [ ] Verify consent / opt-out suppression before enqueue
- [ ] Send a small allowlisted test campaign
- [ ] Verify outbox transitions `sent → delivered → read` (or `failed`) from real callbacks
- [ ] Rotate sandbox credentials before production traffic

Without these secrets, `notify-whatsapp` returns `{ status: "not_configured" }` — never a fabricated `sent`.

## 5. Communications worker

Worker is **off by default**. From a credentialed scheduler run `pnpm communications:worker` with:

| Variable | Notes |
|----------|--------|
| `RINADS_COMMUNICATIONS_WORKER_ENABLED` | `1` |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | server only |
| `RINADS_CRON_SECRET` = `RINADS_CRON_INVOCATION_TOKEN` | per-invocation |
| `RINADS_COMMUNICATIONS_ORGANIZATION_IDS` | explicit tenant allowlist |
| `RINADS_COMMUNICATIONS_BATCH_SIZE` | default 25, cap 100 |
| `RINADS_COMMUNICATIONS_THROUGHPUT_DELAY_MS` | default 250 |
| `RINADS_COMMUNICATIONS_MAX_SCHEDULED_CAMPAIGNS` | default 2, cap 10 |

Optional reviews automation after a tick: `RINADS_REVIEWS_AUTOMATION_URL`, `RINADS_REVIEWS_AUTOMATION_TOKEN`, `RINADS_REVIEWS_AUTOMATION_LIMIT`.

- [ ] Enable worker for one staging org allowlist
- [ ] Confirm only approved + due scheduled campaigns advance
- [ ] Confirm `/communications` shows honest statuses and retries work for `salon.communications.retry`

## 6. Operator smoke (MVP journeys)

- [ ] Calendar: create phone/walk-in appointment with conflict validation
- [ ] Calendar Today / Upcoming + branch filter
- [ ] Settings: booking readiness when branch + service + staff exist; public booking URL shown
- [ ] Dashboard: low-rating queue resolve path
- [ ] Public `/feedback/[token]` without login
- [ ] POS sale → loyalty earn (if program enabled)
- [ ] Campaign draft → approve → send (after Twilio + worker)

## 7. Explicitly deferred (do not block launch)

- ~~Loyalty expiry batch job~~ — shipped (`points_expiry_days` + `pnpm loyalty-expiry:worker`; still off by default)
- Production cron for reviews/recovery (callable API exists; schedule is optional)
- Full Playwright E2E suite

## Cutover progress (agent notes)

### 2026-09-21 (historical)

| Check | Result |
|-------|--------|
| `https://www.rinads.com/api/health` | OK (`productionEnvContract`) |
| `https://glow.rinads.com` | DNS did not resolve yet |
| Separate Vercel project `rinaglow` | Git link / domain setup incomplete at the time |
| Twilio / communications worker secrets | Not configured in agent environment |
| Supabase MCP | Auth required before migration push |

### 2026-09-25 (founder-audit re-check — supersedes DNS row above)

Evidence also recorded in [`docs/founder-audit/PRODUCTION-TRUTH.md`](../founder-audit/PRODUCTION-TRUTH.md) and [`docs/founder-audit/VERCEL-CHECKLIST.md`](../founder-audit/VERCEL-CHECKLIST.md).

| Check | Result |
|-------|--------|
| Production deploy SHA (website + rinaglow) | `eb7a95a` (GitHub Deployments API; matches `main`) |
| `https://www.rinads.com/api/health` | OK (`productionEnvContract`) |
| `https://glow.rinads.com` DNS | **Resolves** via Vercel DNS |
| `https://glow.rinads.com/login` | HTTP 200 — R GLOW login + `rglow-logo` present |
| `https://glow.rinads.com/api/health` | OK (`productionEnvContract`) |
| Vercel projects visible via MCP | `rinads-website`, `rinaglow` on team `rinadss-projects-1ebcffe7` |
| Vercel MCP `get_project` / `list_deployments` | Forbidden / not found — root-dir and env keys **not** re-read via API |
| Supabase migrations applied on production | **UNKNOWN** (Supabase MCP `needsAuth`) |
| Twilio / communications worker | Treat as **not enabled**; keep workers off until founder approval |
| Authenticated salon SSO / operator smoke | **SKIP** — no founder test credentials in this audit |
| Digital Store / Staff phone app | **Not launched** — see [`docs/rglow/PROTOTYPE-GAP.md`](../rglow/PROTOTYPE-GAP.md) |

**Still required from founder (unchanged policy):**

1. Confirm production Supabase migrations through salon vertical routing + loyalty expiry (+ `site_leads` if using website lead persistence).
2. Confirm Auth redirect allowlist includes www, apex, and glow.
3. Confirm cookie domain `.rinads.com` on both Vercel projects.
4. Sandbox Twilio send + webhook signature tests **before** any production traffic.
5. Enable communications worker only with explicit org allowlist + `RINADS_COMMUNICATIONS_WORKER_ENABLED=1`.
6. Authenticated SSO + operator smoke with real personas.

**Do not claim:** Digital Store launched, Staff phone app launched, or live WhatsApp delivery without sandbox evidence.

## Sign-off

| Check | Owner | Date | Result |
|-------|-------|------|--------|
| Migrations applied | | | |
| `glow.rinads.com` healthy | | | |
| Salon SSO redirect | | | |
| Twilio sandbox send + webhook | | | |
| Worker allowlisted tick | | | |
| Operator smoke | | | |
| Loyalty expiry worker (optional) | | | |
