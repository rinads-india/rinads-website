# RINADS Platform Readiness — Release A baseline audit

**Audited:** 23 Oct 2026 · **Commit:** `56ff776e81e370151d7892daadf1e06fe4033620` (main, "feat: RI LABS + 24x7 global self-serve foundation") · **Branch:** `release-a/baseline-audit`
**Method:** static code and migration inspection, local lint/typecheck/test/build. **No production database, Vercel project or provider account was connected.** Every production fact below is either from code or from `docs/production/MVP-CUTOVER-2026-10-22.md`, and is labelled as such.
**Status vocabulary (spec §12):** LIVE · READY · BETA · PREVIEW · BLOCKED · PLANNED. Nothing is marked LIVE: this audit had no end-to-end production evidence for any component.

> **24 October follow-up:** This is a historical baseline. See [the current refactor evidence](RINPO-READINESS-UX-2026-10-24.md) for fixes now present in main and remaining deployment verification gates.

Machine-readable copy: `docs/production/readiness.json`. Marker inventory: `docs/production/demo-stub-inventory.json`. Static RLS scan: `docs/production/rls-static-audit.json`.

---

## 1. Verdict for the 14 Nov gate

The codebase is far more complete than a typical pre-launch repo: payment-gated tenancy, signed-webhook entitlement, fail-closed production env contract, server-verified org context, a model gateway, a governed runtime with approvals and a dead-letter replay, and a tested catalog/entitlement resolver all exist.

The spec §17 trial journey is **not reachable yet**, for five structural reasons:

1. **There is no trial entitlement.** `organization_subscriptions.status = 'trialing'` currently means *payment pending, not entitled* (migration `20261022030000`). A 7-day entitled trial needs a new, server-issued grant.
2. **The generic Business OS has no live tenant data path.** `/os/customers`, `/os/work`, `/os/finance` render demo stores; the `cos_*` tables exist with member RLS but are wired only for RINADS's internal operator mode. "First customer + first task" cannot persist for a trial tenant.
3. **Provisioning is not durable.** No retries, backoff, attempt count, error class or dead-letter state; no `starter-business` template (default is the client template `ambady-nursery`).
4. **Production database state is unknown.** Code warns the production migration ledger is unreconciled; the R GLOW Supabase project was INACTIVE on 22 Oct (cutover doc).
5. **Legal pages are placeholders** (Terms, Privacy, Cookies, DPA, Subprocessors) — a public signup with data collection should not open without them.

Plus one security fix that should ship before anything else: **`payment_webhook_events` has no RLS** (§4, P0-1).

---

## 2. Build baseline

| Step | Command | Result | Notes |
|---|---|---|---|
| Install | `pnpm install --frozen-lockfile` | PASS (12 s) | Node 22.22.0, pnpm 9.15.9 |
| Lint | `pnpm lint` | PASS — 27/27 tasks | 6 warning lines |
| Typecheck | `pnpm typecheck` | PASS — 28/28 tasks | |
| Unit tests | `pnpm test` | PASS — 47/47 tasks | `node:test` suites |
| Build | `pnpm build` | 23/27 in this sandbox | The 4 failures (website, storefront, customer-portal, rinaglow) are all `next/font` failing to download Figtree/Inter/Caveat from Google Fonts — sandbox network policy, not code. All four **compile successfully** with `next build --webpack` and `NEXT_FONT_GOOGLE_MOCKED_RESPONSES`. Vercel build logs remain the production evidence. |
| E2E | `pnpm test:e2e` | Not run | Needs a running app + Supabase. Existing coverage: 7 tests (smoke + auth routing). No trial-journey test. |

Minor: `pnpm-lock.yaml` lacks an importer entry for `packages/communication` (no dependencies, so `--frozen-lockfile` tolerates it). Regenerate the lockfile in a chore commit.

Recommendation (not launch-critical): self-host the three fonts with `next/font/local`. It removes a build-time dependency on Google and matches the vendor-independence principle.

---

## 3. Component readiness

| # | Component | Status | Evidence | Blocker | Next gate |
|---|---|---|---|---|---|
| 1 | Build pipeline | READY | §2 | Font fetch is sandbox-only | Confirm green Vercel builds for all apps |
| 2 | Auth (Supabase Auth, signup, callback, reset) | READY | `apps/website/app/signup`, `app/auth/callback/route.ts` (code exchange + OTP verify) | Email confirmation is not configured in repo `supabase/config.toml`; production setting unknown | Confirm "Confirm email" is ON in production Auth; trial gate must check `email_confirmed_at` server-side |
| 3 | Production env contract / demo safety | READY | `packages/auth` `allowDevelopmentAuthBypass` (development runtime only), `checkProductionEnvContract` → 503 in every app middleware; tests assert no `NEXT_PUBLIC_*SERVICE_ROLE*` | — | Keep |
| 4 | Organization creation (`create_organization`, `provision_tenant`) | READY | Migrations `20260814100001`, `20261022030000`; SECURITY DEFINER, audit row, payment-gated | Default template `ambady-nursery` | Add `starter-business` template; change defaults |
| 5 | Active organization context | READY | `apps/website/lib/org-context.ts` — cookie set only after server membership check | — | Keep |
| 6 | RLS coverage | BLOCKED | 214 tables / 69 migrations; 213 have RLS enabled (31 via `DO` loops); `payment_webhook_events` has none | P0-1 | Additive migration enabling RLS (service-role only) |
| 7 | RLS `FORCE` | PLANNED (decision) | 0 tables forced | Forcing breaks SECURITY DEFINER functions owned by the table owner unless reviewed | ADR: target FORCE only on tables not written by definer functions, or amend spec §5 |
| 8 | Executable RLS / cross-tenant tests | PLANNED | `packages/runtime/tests/rls.test.ts` and others regex-match SQL text; nothing queries a database | Spec §15 tests 1, 2, 9 unproven | Local Supabase in CI + seeded two-tenant tests |
| 9 | Self-serve trial entitlement | PLANNED | No `trial_grants`; `trialing` = non-entitled payment pending | P0-2 semantic conflict | ADR + additive `trial_grants` (Release B) |
| 10 | Provisioning worker | BETA | `packages/platform/src/provisioning-worker.ts`: entitlement-gated (active subscription), idempotent job key `provision:<org>` | No retry/backoff/attempts/error class/DLQ; statuses only pending/running/completed/failed; trial grants not accepted | Release B task B4 |
| 11 | Global catalog resolver | READY (code) | `packages/platform/src/commercial-catalog.ts` + tests: fail-closed, version-pinned, provider-route checks | Not persisted; not used by pricing or checkout | Persist catalog; render pricing from it (Release C) |
| 12 | First-value evaluator | READY (code) | `packages/platform/src/first-value.ts` | No `first_value_events` table; not called by any flow | Release B task B9 |
| 13 | Entitlement resolution (tenancy) | READY | `packages/tenancy/src/load.ts`: `planKey` only when subscription `active`; `planFeatureFlags` returns all-false without a plan | Latent fail-open: `requirePlanModule` falls back to starter modules when `planKey` is undefined, and `planIncludesModule` allows everything when `modules` is empty. Currently unused outside tests. | Make both fail closed (B3) |
| 14 | Recurring billing (Razorpay subscriptions + platform-admin webhook) | BLOCKED | `apps/owner-portal/.../billing/actions.ts` (role + server plan check), `apps/platform-admin/app/api/webhooks/razorpay/route.ts` (signature, `x-razorpay-event-id` idempotency, enqueue provisioning on `active`) | Per cutover doc: Razorpay keys, webhook secret, plan IDs and cycle counts not configured in deploy envs | Founder config (OPEN-QUESTIONS Q4), then Release C |
| 15 | One-time service checkout (edge `payment-webhook`) | BLOCKED | `supabase/functions/payment-webhook/index.ts` verifies signature | P0-1 (table has no RLS) and P1-1 (dedup keyed on payment id, not event id) | Fix both, then test with Razorpay test mode |
| 16 | Capability / availability registries | BETA | Three registries: `apps/website/lib/availability.ts`, `apps/website/lib/rinaspace-capabilities.ts`, `packages/platform/src/capability-registry.ts` (+ runtime action registry) | Vocabulary differs from spec; `isLive()` returns true for PREVIEW; `payment_checkout` and `whatsapp_notify` marked AVAILABLE without production proof | Consolidate onto one registry with spec statuses (P1-4) |
| 17 | RI SPACE shell (`/space`) | BETA | `apps/website/app/space/page.tsx`: auth redirect, server tenancy, onboarding redirect | Page title and UI say "RINASPACE"; no trial banner; Business OS data is demo | B8 |
| 18 | Onboarding | BETA | `app/onboarding/create-organization`, `actions/onboarding.ts` | ~11 inputs vs spec's 5; leads to payment, not trial | B6 |
| 19 | Generic Business OS (customers, projects, tasks, invoices) | PREVIEW | `/os/*` render demo stores (`docs/COMPANY-OS-PHASE1-READINESS.md`); `cos_*` tables have member RLS | No live loaders for tenant mode | B7 — wire `cos_contacts` / `cos_tasks` (or chosen tables) for tenants |
| 20 | Team invites | PLANNED | `organization_invites` table + RLS exists; no app code references it | Gate step 11 | Release B stretch or C |
| 21 | RINPO Runtime | BETA | `packages/runtime`: 12-stage pipeline, approvals gated on `org.manage`, DLQ replay RPC, immutable business events | Production not verified; action contract not yet mapped field-by-field to spec §10.3 | Release F |
| 22 | Model gateway | READY | `packages/intelligence/src/provider-router.ts` with deterministic NLU fallback | `apps/platform-admin/lib/rinpo-control/adapters.ts` duplicates provider config for founder health checks (server-only; minor) | Fold into gateway post-launch |
| 23 | RINPO Phone | PREVIEW | `apps/website/lib/rinpo-phone`, `packages/runtime/src/rinpo-phone` | Demo money view etc. | Release F |
| 24 | Audit logging | BETA | `audit_logs` table; written by `provision_tenant`, `set_organization_status`, and 4 app modules | Not on all writes (spec gate) | Add audit to trial grant, provisioning transitions, entitlement changes |
| 25 | Control Plane (`apps/platform-admin`) | BETA | Platform-privileged gate, tenants, billing events, webhook receiver | No trial/first-value/provisioning-retry views | B4/B9 surfaces |
| 26 | R GLOW | BLOCKED | Salon OS migrations, `apps/rinaglow` builds | RINGLOW Supabase `wqhhhouzattipxjarlji` INACTIVE on 22 Oct (cutover doc) | Founder decision Q2 |
| 27 | Production migration ledger | BLOCKED (unknown) | `onboarding.ts` warns "deferred until the production migration ledger is reconciled" | Not inspected — this audit did not connect to production | Founder runs read-only ledger diff (Q1) |
| 28 | Custom domains (Vercel) | BLOCKED | `packages/domains/src/vercel.ts` | Returns `ok: true` with `mock_…` id when credentials are absent (P1-2) | Fail closed |
| 29 | Legal pages | BLOCKED | Terms, Privacy, Cookies, DPA, Subprocessors use `AwaitingCounselNotice` | Counsel copy | Founder Q5 |
| 30 | n8n boundary (spec D3) | READY | No n8n code integration; only an archived reference JSON | — | Keep |
| 31 | World bridge | PREVIEW | `packages/world-contract` (83-line typed contract) | Out of launch scope (D4) | Release G |
| 32 | Status / health pages | BETA | `/status`, `/trust/status` are honest stubs; `health-check` edge function | No live health feed | Post-launch |
| 33 | Public WhatsApp/world insert endpoints | READY | `world_wishlist`, `world_reports`: insert-only grants to `anon` | No rate limit on anon insert | Optional rate limit |

---

## 4. Findings by priority

### P0 — fix before any public trial

**P0-1. `public.payment_webhook_events` has no RLS.** Created in `20260824100000_rinads_services_foundation.sql`, never enabled, never revoked. In Supabase, `public` tables are exposed through the Data API with default grants, so the stored Razorpay payloads (payment entities, customer contact fields) may be readable with the anon key. Fix: additive migration `ALTER TABLE … ENABLE ROW LEVEL SECURITY` with no policies (service role bypasses RLS, so the edge function keeps working) plus `REVOKE ALL … FROM anon, authenticated`. Verify against production immediately; if exposed, treat stored payloads as a data incident.

**P0-2. Trial semantics conflict.** `trialing` is deliberately non-entitled today. Reusing it would weaken the payment gate. Recommended: keep `organization_subscriptions` as-is for launch and add a separate server-issued `trial_grants` table that the entitlement resolver and provisioning worker accept alongside `active`. Rename `trialing` → `pending_payment` after launch.

**P0-3. Production database state unknown.** Unreconciled migration ledger (code warning) and inactive R GLOW project. No Release B migration should be pushed until the ledger is diffed.

**P0-4. No live Business OS for tenants.** First value cannot be achieved by a trial tenant.

**P0-5. Provisioning not durable** (no retries/DLQ) and default template is a client's catalog.

**P0-6. No executable cross-tenant tests.** Spec §15 requires them before launch.

**P0-7. Legal pages are placeholders.** Signup collects personal data; India's DPDP Act 2023 applies.

### P1

- **P1-1.** Edge webhook dedup key is the payment/order entity id, so a second event type for the same payment (e.g. `payment.authorized` then `payment.captured`) is dropped as a duplicate. Use the `x-razorpay-event-id` header as the platform-admin route does.
- **P1-2.** Vercel domains client returns success with a mock id when unconfigured. Fail closed.
- **P1-3.** `provision_tenant` / `organization_settings` default `ambady-nursery`. Replace with `starter-business`.
- **P1-4.** Availability claims exceed evidence: `payment_checkout` and `whatsapp_notify` are AVAILABLE; `isLive()` counts PREVIEW as live; `rinaspace-capabilities.ts` marks many items `live`.
- **P1-5.** `requirePlanModule` / `planIncludesModule` fail open on missing plan or empty module list (latent; unused in apps).

### P2

- `runtime-worker` defaults `RUNTIME_ORG_ID` to `org_ambady_demo` in Supabase mode.
- Worker bearer-token comparison in `apps/rinaglow/app/api/automations/process/route.ts` is not constant-time.
- No `FORCE ROW LEVEL SECURITY` anywhere (decision needed, see row 7).
- Lockfile drift for `packages/communication`.
- `/space` public naming still "RINASPACE".

### Confirmed good (no action)

Service-role keys absent from client code (and tested); production env contract; server-side active-org check; owner billing checks role and resolves plan server-side; service orders take org from server tenancy and price from the database; platform-admin webhook verifies signature and uses provider event-id idempotency; runtime approvals require `org.manage`; `set_organization_status` requires platform privilege; no n8n coupling; demo mode is development-runtime only.

---

## 5. Demo / stub inventory summary

451 marker rows in production source (`docs/production/demo-stub-inventory.json`): **397 A** (intentional demo or "book a demo" CTA), **44 B** (preview/status labels), **10 C** (needs production work), **0 D**. 38 rows were classified by heuristic only and flagged `needs_review`. Every C row was verified by hand: five legal pages plus two shared legal components, the Vercel domains mock, and the runtime-worker default org.

---

## 6. Scanner limitations

The RLS scan is static. It cannot see policies created through dynamic SQL other than the two `DO` loops checked by hand, and it reports 0 policies for some tables whose policies are created dynamically (e.g. `cos_*`, `customer_profiles`, `operational_tasks`). Production may differ from migrations (P0-3). Treat `rls-static-audit.json` as a map, not proof.
