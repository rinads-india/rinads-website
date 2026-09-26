# Live E2E verification — 2026-09-26

**Verified at:** 2026-09-26 ~12:55 UTC  
**Agent run:** Cursor Cloud Agent (`bc-01a0d63b-8603-7c00-8376-d9afe406ea81`)  
**Git `main`:** `67473ae` — `Secure production access to RINADS internal portals (#86)`  
**Production deploy (GitHub Deployments):** website + rinaglow → `67473ae` (2026-09-26T09:27Z)  
**Policy:** Non-destructive probes only. No migrations applied, no secrets rotated, no Twilio/worker enablement, no invented commercial claims.

## Labels used

Same vocabulary as [PRODUCTION-TRUTH.md](./PRODUCTION-TRUTH.md): **PASS / PARTIAL / SKIP / BLOCKED / KEEP OFF**.

---

## A. Production Supabase migrations

| Check | Result | Evidence |
|-------|--------|----------|
| Repo contains salon vertical routing | BUILT | `supabase/migrations/20260916100003_fix_salon_vertical_routing.sql` |
| Repo contains loyalty expiry | BUILT | `supabase/migrations/20260921100000_salon_loyalty_expiry.sql` |
| Repo contains `site_leads` | BUILT | `supabase/migrations/20260924100000_site_leads.sql` |
| Production migration **list** (dashboard/CLI) | **BLOCKED** | Supabase MCP `needsAuth` (auth timed out this run); no production `supabase db` access |
| `site_leads` usable in production | **PASS (inferred)** | Live `POST /api/leads` → `stored: true` + UUID `id` (see §D). Table and/or configured persistence path is live. |
| Salon routing + loyalty expiry applied | **BLOCKED** | Cannot list `supabase_migrations` without founder auth |

**Founder action still required:** In Supabase production, confirm applied versions include `20260916100003_*` through `20260924100000_site_leads` (checklist in [SUPABASE-MIGRATION-REVIEW.md](./SUPABASE-MIGRATION-REVIEW.md)).

---

## B. Auth allowlist + cookie domain

| Check | Result | Evidence |
|-------|--------|----------|
| Code sets cookie domain `.rinads.com` in production | **PASS (code)** | `packages/auth/src/cookies.ts` — `AUTH_COOKIE_DOMAIN = ".rinads.com"` when `isProductionCookieEnv` |
| Unit contract for cookie domain | **PASS (CI)** | `packages/auth/src/deployment.test.ts`, `access.test.ts` |
| Vercel env `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` on website + rinaglow | **BLOCKED** | Vercel MCP: `rinads-website` / `rinaglow` project APIs return 404/empty for this token; cannot read env keys |
| Supabase Auth redirect allowlist (`www` / apex / `glow`) | **BLOCKED** | Supabase dashboard / MCP unauthenticated |
| Cross-host SSO cookie proven with real login | **SKIP** | No founder test credentials |

**Founder action still required:** Dashboard confirm Auth URL allowlist + both Vercel projects show `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=.rinads.com` (see [VERCEL-CHECKLIST.md](./VERCEL-CHECKLIST.md)).

---

## C. Authenticated persona smoke

Source checklist: [RELEASE-ACCEPTANCE.md](./RELEASE-ACCEPTANCE.md).

| Persona / path | Result | Notes |
|----------------|--------|-------|
| Unauth `/os` → login | **PASS** | Live `307` → `/signup?mode=login&next=%2Fos` (2026-09-26) |
| Non-salon member `/os` | **SKIP** | No test account |
| Salon member → glow calendar | **SKIP** | No test account + cookie/allowlist unproven |
| No-membership → onboarding | **SKIP** | No test account |
| Multi-org without active org | **SKIP** | No test account |
| R GLOW operator journeys | **SKIP** | No test account |

**Cannot declare Business OS or R GLOW operator E2E live** until these SKIP rows become PASS.

---

## D. Lead persistence (commercially reliable path)

| Check | Result | Evidence |
|-------|--------|----------|
| Valid lead accepted | **PASS** | `POST https://www.rinads.com/api/leads` 2026-09-26T12:55:47Z |
| `stored: true` | **PASS** | Response body |
| Persistence id returned | **PASS** | `id=32188892-3852-4389-97bc-c1d06b85a8c8` |
| Probe identity | — | `workEmail=live-e2e-20260926T125547Z@rinads-verify.example` (safe to delete) |
| Row visible in Supabase UI | **BLOCKED** | Agent cannot open production Table Editor |

**Verdict:** Lead capture is **commercially persistence-proven** via live API (`stored: true`). Founder may optionally confirm the UUID row in `site_leads` (or webhook sink) and delete the probe.

Invalid/legacy payload correctly rejected (field validation) — confirms #84 schema is live.

---

## E. Twilio + communications worker

| Check | Result | Evidence |
|-------|--------|----------|
| Worker enablement flag | **KEEP OFF** | `scripts/cron/communications-worker.ts` exits unless `RINADS_COMMUNICATIONS_WORKER_ENABLED=1` |
| FOUNDER-SIGNOFF for sandbox send | **Not signed** | [FOUNDER-SIGNOFF.md](./FOUNDER-SIGNOFF.md) §C blank |
| Sandbox Twilio send this run | **NOT RUN** | Policy: no send without founder sign-off |
| Production blast / allowlisted tick | **NOT RUN** | Must stay disabled |

**Verdict:** Messaging slice remains **not live**. Do not enable workers or Twilio until FOUNDER-SIGNOFF is signed.

---

## F. Public surface re-probe (this run)

| Host / path | Result |
|-------------|--------|
| `www` + `glow` `/api/health` → `productionEnvContract: ok` | PASS |
| Marketing routes `/`, `/platform`, `/solutions`, `/rinpo`, `/pricing`, `/security`, `/contact`, `/projects`, `/academy` | PASS (HTTP 200) |
| `glow.rinads.com/login` | PASS (HTTP 200) |
| DNS `www` / `glow` → Vercel | PASS |

---

## G. Open PR housekeeping

| PR | Disposition (this verification) |
|----|----------------------------------|
| [#79](https://github.com/rinads-india/rinads-website/pull/79) lint NavDropdown | **Superseded** — `setMounted` absent on `main` NavDropdown; CONFLICTING; close for hygiene |
| [#70](https://github.com/rinads-india/rinads-website/pull/70) project intake | **Stale** vs commercial `/projects` + LeadForm; CONFLICTING; close (rebase only if product restarts intake) |
| [#36](https://github.com/rinads-india/rinads-website/pull/36) Vercel Analytics | **Defer/close** — prefer single analytics path vs optional GTM from #73; CONFLICTING |

---

## Slice readiness (updated 2026-09-26)

| Slice | Ready for public/live? |
|-------|------------------------|
| Public marketing site | **PARTIAL yes** — pages + health OK; legal/pricing evidence incomplete |
| Lead capture persistence | **Yes (API-proven)** — `stored: true`; UI row confirm optional |
| Full migration inventory on prod | **No** until founder lists versions |
| Business OS authenticated | **No** — persona smoke SKIP |
| R GLOW operator console | **Code yes / ops no** |
| Live customer WhatsApp | **No** — KEEP OFF |
| Full platform E2E | **No** |

## Bottom line

Engineering for commercial + OS + R GLOW MVP surfaces remains **built and deployed** at `67473ae`. Live E2E is still gated on **ops verification** (migration list, Auth allowlist, cookie env confirm, persona accounts) and **FOUNDER-SIGNOFF** before any messaging enablement — not on rebuilding the monorepo. Lead persistence is no longer the blocker it was on 2026-09-25.
