# Release acceptance checklist and test results

**Audit date:** 2026-09-25 (refresh 2026-09-26)  
**Production SHA under test:** `67473ae` (website + rinaglow) — see [LIVE-E2E-VERIFICATION-2026-09-26.md](./LIVE-E2E-VERIFICATION-2026-09-26.md)

## Results legend

- **PASS** — proven this audit or cited CI
- **FAIL** — proven broken
- **SKIP** — blocked by access / credentials / policy
- **N/A** — out of scope for current release slice

## Automated CI (repository)

| Gate | Result | Evidence |
|------|--------|----------|
| Lint / typecheck / test / build on `main` path | PASS (assumed via merge + #79 CI) | #78/#77 merged; #79 workflow SUCCESS |
| Playwright in CI | SKIP / N/A | Not configured in `.github/workflows/ci.yml` |
| Commercial readiness unit tests | BUILT | `apps/website/tests/commercial-readiness.test.ts` (run in CI on PRs) |

## Production HTTP smoke (this audit)

| Test | Result | Notes |
|------|--------|-------|
| www `/` 200 | PASS | |
| www `/platform` 200 | PASS | |
| www `/solutions` 200 | PASS | |
| www `/rinpo` 200 | PASS | |
| www `/pricing` 200 | PASS | |
| www `/security` 200 | PASS | |
| www `/contact` 200 | PASS | |
| www `/projects` 200 | PASS | |
| www `/academy` 200 | PASS | |
| www `/os` → login for anonymous | PASS | Sign Up page |
| www `/api/health` | PASS | productionEnvContract ok |
| apex → www | PASS | 307 |
| glow `/login` | PASS | R GLOW branding |
| glow `/api/health` | PASS | productionEnvContract ok |

## Authenticated / tenancy (BLOCKED this audit)

| Test | Result | Needs |
|------|--------|-------|
| Non-salon member uses `/os` | SKIP | Test account |
| Salon member SSO to glow calendar | SKIP | Test account + cookie domain |
| No membership → onboarding | SKIP | Test account |
| Multi-org without active org stays `/os` | SKIP | Test account |
| Client role cannot see Money/billing bridges | SKIP | Test account |
| Mobile More focus trap on real device | SKIP | Browser session |
| Lead form persists (`stored: true`) | PASS | Live POST 2026-09-26 → id `32188892-3852-4389-97bc-c1d06b85a8c8`; Table Editor row view still SKIP |
| Razorpay / Stripe live payment | SKIP | Credentials; Stripe NOT_IMPLEMENTED |

## R GLOW operator smoke (BLOCKED)

| Test | Result |
|------|--------|
| Calendar walk-in/phone booking | SKIP |
| POS → loyalty earn | SKIP |
| Campaign approve → send | SKIP (Twilio BLOCKED) |
| Public feedback token | SKIP |
| Communications worker tick | SKIP (must stay disabled) |

## RINPO

| Test | Result |
|------|--------|
| Public `/api/chat` rule-based (no LLM required) | PASS (code review) |
| Deterministic salon tools exist | PASS (code review) |
| Pilot appointment→confirmation audit path | PASS (code on main #83); send gated |
| Live LLM in production | SKIP (key presence unknown) |

## Acceptance for “commercially usable slice”

A slice may be called **commercially usable** only when:

1. Production SHA known and health PASS.
2. Relevant migrations verified applied.
3. Auth/tenancy smoke PASS for that slice’s personas.
4. No fabricated commercial claims on pages in scope.
5. Founder signed FOUNDER-SIGNOFF for any send/worker/migrate actions.

**Current overall (2026-09-26):** Public marketing + env contract + **lead persistence** = **PARTIAL commercial surface** (leads API-proven). Authenticated OS / R GLOW ops / messaging = **not accepted** until SKIP items cleared and FOUNDER-SIGNOFF signed for messaging.
