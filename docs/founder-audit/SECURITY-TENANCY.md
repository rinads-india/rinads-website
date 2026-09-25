# Security and tenancy findings

**Audit date:** 2026-09-25  
**Scope:** Business OS `/os`, R GLOW tenancy, marketing lead capture. Read-only; no production DB changes.

## Executive summary

PR **#75** (tenancy gate, org-role destinations, More a11y) is **MERGED** and included in production SHA `eb7a95a`. Unauthenticated `/os` correctly routes to login on live `www.rinads.com`. Residual risk is **authenticated E2E not re-proven in this audit**, demo-mode bypass outside Supabase, and UI gating that must never replace portal/API authorization.

## #75 release-gate report (post-merge)

### Intended controls (in source)

| Control | Implementation | Status |
|---------|----------------|--------|
| Session required on every nested `/os/*` | `apps/website/app/os/layout.tsx` → `requireOsShellAccess()` | MERGED |
| Membership + active org + onboarding + salon→R GLOW | `apps/website/lib/os-shell-access.ts` + `resolveDestinationForMemberships` | MERGED |
| Open-redirect hardening on login `next` | `sanitizeOsLoginNext()` | MERGED |
| Trusted `RoleKey` for destinations | Layout → `OsOrgRoleProvider`; live never trusts AuthContext placeholder | MERGED |
| Bridge status `external_public` vs `available` + `minTier` | `apps/website/lib/os-module-destinations.ts` | MERGED |
| Mobile More focus trap / Escape / restore | #75 a11y changes | MERGED (prior Playwright cited in PR; not in CI) |

### Verified this audit

| Check | Result |
|-------|--------|
| Unauthenticated `/os` | Live → Sign Up / login (TESTED) |
| Production env contract | `www` + `glow` health OK (TESTED) |
| Authed member stays in `/os` | BLOCKED (no credentials) |
| Authed salon member → `glow.rinads.com` | BLOCKED |
| No-membership → onboarding | BLOCKED |
| Different tenant membership isolation | BLOCKED |
| Mobile More a11y on production | BLOCKED (no browser session) |
| Unauthorized API access to owner-portal billing | Not re-tested; portals must keep server RBAC |

### Residual risks (accept or schedule)

1. **Demo mode:** When `!isSupabaseMode()`, shell access returns `{ enforced: false }`. Production health contract requires Supabase fail-closed — treat any `USE_DEMO_STORE=1` in production as P0 incident.
2. **UI ≠ authorization:** Hiding Money/billing bridges by role does not protect `owner-portal` / APIs. Server RBAC + RLS remain the real gates (`packages/permissions`, Supabase RLS).
3. **AuthContext placeholder role (`client`)** — must never drive live privileged destinations (mitigated by #75 trusted membership roleKey).
4. **Public signup demo role hardcoding** — pre-existing; track separately.
5. **Playwright not in CI** — shell a11y regressable without gate.

## Lead capture security

| Control | Status |
|---------|--------|
| Validation + honeypot + dedupe | BUILT (#73) |
| `site_leads` RLS deny-all for anon/authenticated; service-role insert | BUILT in migration |
| Honest `{ stored: false }` when no webhook/service role | BUILT |
| Production migration applied | BLOCKED (Supabase MCP unauthenticated) |

## R GLOW / cookie domain

| Control | Status |
|---------|--------|
| Shared cookie domain `.rinads.com` required for SSO | Documented in `VERCEL_RINAGLOW.md` |
| Live cookie domain value | BLOCKED (env unread) |
| Auth redirect allowlist includes glow + www | BLOCKED (Supabase dashboard) |

## Recommendations (no automatic merge/deploy)

1. Founder: authenticate Supabase MCP or export migration status for production project.
2. Founder: provide one non-salon, one salon, one no-membership test account for E2E checklist in RELEASE-ACCEPTANCE.
3. Keep communications workers and Twilio disabled until sandbox sign-off.
4. Add Playwright smoke for `/os` More dialog + unauth redirect into CI when capacity allows (separate PR).
