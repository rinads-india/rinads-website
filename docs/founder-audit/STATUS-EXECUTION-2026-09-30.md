# Status execution record — 2026-09-30

**Executed at:** 2026-09-30 ~00:10 UTC  
**Trigger:** Implement current-status plan (merge #96 + remaining gates)  
**Policy:** Non-destructive. No Twilio/worker enablement. No Auth allowlist mutation without dashboard access.

## 1. Merge PR #96 — DONE

| Item | Result |
|------|--------|
| PR | [#96](https://github.com/rinads-india/rinads-website/pull/96) |
| State | **MERGED** 2026-09-30T00:06:32Z |
| Merge commit | `f273306` |
| CI before merge | Lint/typecheck/test/build SUCCESS; Playwright smoke SUCCESS |
| Local `main` | Fast-forwarded to `f273306` |

Note: `main` also includes home hero work from #95 (`2b08421`) ahead of the docs commit.

## 2. Auth redirect allowlist — EXPLICITLY DEFERRED

| Attempt | Result |
|---------|--------|
| Supabase MCP Auth URL API | Not available |
| `SUPABASE_ACCESS_TOKEN` / Supabase CLI | Absent in agent environment |
| Dashboard `…/auth/url-configuration` | Redirected to **sign-in** wall (no founder session) |

**Required entries (unchanged policy):**

- `https://www.rinads.com/**`
- `https://rinads.com/**`
- `https://glow.rinads.com/**`

**Verdict:** Cannot confirm live allowlist without founder Supabase login. Cookie domain `.rinads.com` remains **PASS** on website + rinaglow (Vercel env). Founder must open Auth URL configuration and tick the three patterns above, then update this row to PASS.

## 3. Authenticated persona smoke — EXPLICITLY DEFERRED

| Check | Result |
|-------|--------|
| Unauth `/os` → login | **PASS** — `307` → `https://www.rinads.com/signup?mode=login&next=%2Fos` |
| `glow` `/login` | **PASS** — HTTP 200 |
| `www` + `glow` `/api/health` | **PASS** — `productionEnvContract: ok` |
| Salon → glow SSO | **SKIP** — `E2E_SALON_EMAIL` / `E2E_SALON_PASSWORD` unset |
| Non-salon `/os` | **SKIP** — `E2E_MEMBER_*` unset |
| No-membership onboarding | **SKIP** — `E2E_NOMEMBER_*` unset |
| Playwright `tests/e2e/auth.spec.ts` | Not run (credentials missing; suite auto-skips) |

**Verdict:** Unauthenticated gates PASS. Authenticated matrix **explicitly deferred** until founder provides non-production test personas via `E2E_*` env vars (see `tests/e2e/auth.spec.ts` header).

## 4. Twilio / communications worker — KEEP OFF (reconfirmed)

| Check | Result |
|-------|--------|
| Vercel website env keys | No `RINADS_COMMUNICATIONS_WORKER_ENABLED`; no Twilio keys among listed envs |
| Vercel rinaglow env keys | Same — worker flag absent; `USE_DEMO_STORE=0` |
| Code gate | `scripts/cron/communications-worker.ts` exits unless flag `=== "1"` |
| FOUNDER-SIGNOFF Twilio sandbox | Not signed — no send attempted |

**Verdict:** Messaging remains **KEEP OFF**. Do not set `RINADS_COMMUNICATIONS_WORKER_ENABLED=1` or configure live Twilio until FOUNDER-SIGNOFF §C is signed for sandbox send + allowlisted worker.

## Founder follow-ups (outside this execution)

1. Sign in to Supabase → Auth → URL configuration → confirm the three redirect patterns.
2. Create/export three E2E personas and run `E2E_BASE_URL=https://www.rinads.com pnpm exec playwright test tests/e2e/auth.spec.ts`.
3. Only then consider Twilio sandbox + worker enablement under FOUNDER-SIGNOFF.
