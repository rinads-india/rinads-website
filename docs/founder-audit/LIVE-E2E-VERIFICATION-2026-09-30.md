# Live E2E verification — 2026-09-30

**Verified at:** 2026-09-29 ~22:36 UTC (local 2026-09-30 IST)  
**Git `main` / production SHA:** `8305a64` — `docs(creative): add independent launch architecture… (#91)`  
**Production deploy (Vercel):** website `dpl_D64YQYmw…` + rinaglow `dpl_3SLPoAzT…` → `8305a64064a28e439ff46b7e8d82c4927efb0e54`  
**Supabase project:** `rinads-platform` (`zznigagovilnffyzcrlj`) — `ACTIVE_HEALTHY`  
**Policy:** Non-destructive probes only. No Twilio/worker enablement. No Auth allowlist mutation. Probe lead rows deleted after proof.

## Labels

Same vocabulary as [PRODUCTION-TRUTH.md](./PRODUCTION-TRUTH.md): **PASS / PARTIAL / SKIP / BLOCKED / KEEP OFF**.

---

## A. Production Supabase migrations

| Check | Result | Evidence |
|-------|--------|----------|
| Applied migration list via Supabase MCP | **PASS** | `list_migrations` on `zznigagovilnffyzcrlj` — 31 versions through `20260924100000_site_leads` |
| `20260916100003_fix_salon_vertical_routing` | **PASS** | Present in `schema_migrations` |
| `20260921100000_salon_loyalty_expiry` | **PASS** | Present |
| `20260924100000_site_leads` | **PASS** | Present; `to_regclass('public.site_leads')` true |
| Salon loyalty relation present | **PASS** | `to_regclass('public.salon_loyalty_accounts')` true |

**Closes prior BLOCKED** migration-list gap from 2026-09-26.

---

## B. Auth cookie domain + Vercel env (plain keys only)

| Check | Result | Evidence |
|-------|--------|----------|
| Website `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` | **PASS** | Vercel env plain value `.rinads.com` (prod + preview) |
| Rinaglow `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` | **PASS** | Same `.rinads.com` |
| Website / rinaglow `NEXT_PUBLIC_RINAGLOW_URL` | **PASS** | `https://glow.rinads.com` |
| Rinaglow `USE_DEMO_STORE` | **PASS** | `0` |
| Rinaglow `USE_SUPABASE` | **PASS** | `1` |
| Supabase Auth redirect allowlist | **BLOCKED** | Dashboard confirm still required (no MCP Auth URL API this run) |
| Cross-host SSO with real login | **SKIP** | No founder test credentials |

---

## C. Authenticated persona smoke

| Persona / path | Result | Notes |
|----------------|--------|-------|
| Unauth `/os` → login | **PASS** | Live `307` → `https://www.rinads.com/signup?mode=login&next=%2Fos` |
| Non-salon / salon / onboarding / multi-org | **SKIP** | No test accounts |
| R GLOW operator journeys | **SKIP** | No test accounts |

---

## D. Lead persistence

| Check | Result | Evidence |
|-------|--------|----------|
| Valid lead accepted | **PASS** | `POST /api/leads` 2026-09-29T22:36:53Z |
| `stored: true` | **PASS** | Response body |
| Persistence id | **PASS** | `id=d83061cc-6e23-4928-8826-064f00663711` |
| Probe cleanup | **PASS** | Deleted `live-e2e-%@rinads-verify.example` rows (incl. prior 2026-09-26 probe) via service SQL |

Invalid/legacy minimal payload correctly rejected (missing outcome/role/… fields).

---

## E. Twilio + communications worker

| Check | Result | Evidence |
|-------|--------|----------|
| Worker enablement | **KEEP OFF** | No `RINADS_COMMUNICATIONS_WORKER_ENABLED` among readable rinaglow/website env keys; FOUNDER-SIGNOFF unsigned |
| Sandbox Twilio send | **NOT RUN** | Policy |

---

## F. Public surface re-probe

| Host / path | Result |
|-------------|--------|
| `www` + `glow` `/api/health` → `productionEnvContract: ok` | PASS |
| `glow.rinads.com/login` | PASS (HTTP 200) |
| Marketing `/`, `/platform`, `/solutions`, `/rinpo`, `/pricing`, `/security`, `/contact`, `/projects`, `/academy`, `/platform/creative-os` | PASS (HTTP 200) |

---

## G. Open PR housekeeping

| PR | Disposition |
|----|-------------|
| [#92](https://github.com/rinads-india/rinads-website/pull/92) Thrissur world Phase 1 | **DRAFT** — leave open |
| [#87](https://github.com/rinads-india/rinads-website/pull/87) Unity RINPO scaffold | **DRAFT** — review only |
| Prior #79 / #70 / #36 | Not in open list (hygiene done or closed earlier) |

---

## Slice readiness (updated 2026-09-30)

| Slice | Ready for public/live? |
|-------|------------------------|
| Public marketing site | **PARTIAL yes** — health + routes OK; legal/pricing evidence incomplete |
| Lead capture persistence | **Yes** — API + DB confirmed |
| Full migration inventory on prod | **Yes** — applied through `site_leads` |
| Cookie domain env | **Yes** — `.rinads.com` on website + rinaglow |
| Auth redirect allowlist | **No** until founder dashboard confirm |
| Business OS authenticated | **No** — persona smoke SKIP |
| R GLOW operator console | **Code + env yes / authed ops no** |
| Live customer WhatsApp | **No** — KEEP OFF |
| Creative OS product | **No** — marketing Coming soon only (see Gate A docs) |

## Bottom line

Ops verification advanced: **migrations applied**, **cookie domain confirmed**, **prod SHA = main `8305a64`**, lead path re-proven. Remaining release blockers are **Auth allowlist dashboard confirm**, **authenticated persona smoke**, and **FOUNDER-SIGNOFF before any messaging enablement**.
