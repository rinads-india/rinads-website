# Release acceptance checklist and test results

**Audit date:** 2026-09-25 (refresh **2026-09-30** post-#96)  
**Production SHA under test:** `f273306` (website + rinaglow track `main`) — see [STATUS-EXECUTION-2026-09-30.md](./STATUS-EXECUTION-2026-09-30.md)

## Results legend

- **PASS** — proven this audit or cited CI
- **FAIL** — proven broken
- **SKIP** — blocked by access / credentials / policy
- **N/A** — out of scope for current release slice
- **DEFERRED** — founder explicitly deferred with evidence of attempt

## Automated CI (repository)

| Gate | Result | Evidence |
|------|--------|----------|
| Lint / typecheck / test / build on #96 | PASS | PR #96 statusCheckRollup SUCCESS |
| Playwright smoke (public website) on #96 | PASS | CI job SUCCESS |
| Playwright authenticated auth.spec | DEFERRED | `E2E_*` unset |

## Production HTTP smoke (2026-09-30)

| Test | Result | Notes |
|------|--------|-------|
| www `/api/health` | PASS | productionEnvContract ok |
| glow `/api/health` | PASS | productionEnvContract ok |
| www `/os` → login for anonymous | PASS | 307 → signup login |
| glow `/login` | PASS | HTTP 200 |

## Authenticated / tenancy

| Test | Result | Needs |
|------|--------|-------|
| Non-salon member uses `/os` | DEFERRED | `E2E_MEMBER_*` |
| Salon member SSO to glow calendar | DEFERRED | `E2E_SALON_*` |
| No membership → onboarding | DEFERRED | `E2E_NOMEMBER_*` |
| Auth redirect allowlist confirm | DEFERRED | Supabase dashboard login |
| Lead form persists | PASS | Prior live POST + DB |

## Communications

| Test | Result |
|------|--------|
| Communications worker | KEEP OFF (reconfirmed) |
| Twilio sandbox send | KEEP OFF (not approved) |

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
