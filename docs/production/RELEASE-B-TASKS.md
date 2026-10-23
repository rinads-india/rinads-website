# Release B — Self-serve 7-day trial: task list

**Source:** `PLATFORM-READINESS.md` (baseline 23 Oct 2026) · **Spec:** `docs/RINADS_MASTER_SPEC.md` §8.3, §9, §15, §16
**Window:** 29 Oct – 3 Nov 2026 · **Exit criteria (spec §16):** server trial grant; RI ID verify; org create; async idempotent provisioning; RI SPACE loads; RINPO loads; expiry → read-only.

Rules for every task: additive migrations only, each with a rollback note; run against local/preview Supabase only; tests before PR; `Start 7-Day Trial` CTA stays behind a flag, off.

---

## Before Release B starts (Release A tail, 24–28 Oct)

| # | Task | Files | Migration | Tests | Est. |
|---|---|---|---|---|---|
| A1 | **Close P0-1:** enable RLS on `payment_webhook_events`, revoke from `anon`, `authenticated` | new `supabase/migrations/2026102…_payment_webhook_events_rls.sql` | Y, additive. Rollback: `DISABLE ROW LEVEL SECURITY` + re-grant | Static SQL test + executable test once B11 harness exists | 1 h |
| A2 | Fix P1-1: edge webhook dedup on `x-razorpay-event-id`, fall back to current key only if header absent | `supabase/functions/payment-webhook/index.ts` | N | Replay test: same event id → duplicate; two event types for one payment → both processed | 2 h |
| A3 | Fix P1-2: Vercel domains fail closed when unconfigured | `packages/domains/src/vercel.ts` + callers | N | Unit test | 1 h |
| A4 | Fix P1-5: `requirePlanModule` and `planIncludesModule` fail closed on missing plan / empty list | `packages/tenancy/src/plan-limits.ts`, `packages/platform/src/subscriptions.ts` | N | Update `plan-limits.test.ts` | 1 h |
| A5 | Executable test harness: local Supabase in CI, two seeded tenants, helper to act as user A/B/anon | `.github/workflows/*`, `tests/rls/*` | N | Harness self-test | 6 h |
| A6 | ADR-014: trial grants separate from subscriptions (P0-2). ADR-015: Business OS tenant tables (P0-4) | `docs/decisions/` | N | — | 2 h |

**Dependency:** founder answers Q1 (production ledger) before any B migration is applied anywhere but local.

---

## Release B (29 Oct – 3 Nov)

Ordered by dependency. Critical path: **B1 → B2 → B4 → B6 → B8 → B12**.

| # | Task | Depends on | Files to touch | Migration | Tests to add | Est. |
|---|---|---|---|---|---|---|
| B1 | **`starter-business` template** — generic seed (no Ambady catalog); register in `VerticalTemplateKey`; change defaults in `provision_tenant` and `organization_settings.vertical_key` from `ambady-nursery` | — | `packages/platform/src/templates/*`, new migration | Y, additive: insert template row; `CREATE OR REPLACE` `provision_tenant` with new default; `ALTER … SET DEFAULT`. Rollback: restore previous defaults | Template parse/seed unit tests; default-template test | 4 h |
| B2 | **`trial_grants` table + `public.grant_trial()` RPC** (SECURITY DEFINER). Checks: caller is active owner of the org; `auth.users.email_confirmed_at` not null; no prior grant for this user or org; org has no `active` subscription. Writes grant (7 days, `trial-starter` manifest), audit row, and an idempotent provisioning job `provision:<org>`. Unique constraints on `ri_id` and `organization_id`. RLS: members select own org; no client insert/update | B1, A5, A6 | new migration; `packages/platform/src/trial.ts` | Y, additive. Rollback: drop function + table | **Spec §15-4:** browser cannot grant trial (direct insert denied; RPC rejects unverified email, non-owner, second grant, paid org). Idempotent double call returns the same grant | 6 h |
| B3 | **Entitlement resolver accepts trial** — tenancy loader: plan baseline = active subscription OR unexpired trial grant (trial manifest); expose `entitlementState` = `paid_active` / `trialing` / `expiring` / `expired_read_only` / `none` | B2 | `packages/tenancy/src/load.ts`, `types.ts`, `feature-flags.ts` | N | Unit: each state; expired grant → no write modules; browser cookie/flag cannot change state | 5 h |
| B4 | **Durable provisioning** — accept valid trial grant as precondition; add `attempts`, `next_attempt_at`, `last_error_class`, `dead_lettered_at`; extend status CHECK with `retrying`, `blocked`, `dead_letter`; bounded exponential backoff (e.g. 30 s → 30 min, max 6 attempts); audit each transition; Control Plane list + "retry" for dead-lettered jobs | B2 | `packages/platform/src/provisioning-worker.ts`, `runtime-jobs.ts`, `scripts/cron/provisioning-worker.ts`, platform-admin tenants page, new migration | Y, additive columns + CHECK widened. Rollback: drop columns, restore CHECK | Worker: trial-entitled job runs; unentitled job blocked; transient error → retrying with backoff; max attempts → dead_letter; re-run is idempotent (no duplicate seed) | 8 h |
| B5 | **Expiry and read-only** — cron marks `expiring` at T-2d and `expired_read_only` at T+7d; queue expiry communication through existing outbox; enforce read-only with `private.org_can_write(org_id)` in **write** policies of the launch tables (B7) | B3, B7 | new migration; `scripts/cron/trial-lifecycle-worker.ts` | Y, additive helper + policy replacements on launch tables only. Rollback: previous policies | **Spec §15-6:** expired org write denied at DB level; read still allowed; conversion restores write | 8 h |
| B6 | **5-field onboarding → trial** — business name, industry, country, location, primary goal; server action: create org (B1 template) → `grant_trial` → set active org → redirect to provisioning status → `/space`. Keep existing paid path for "buy now" | B2, B4 | `apps/website/app/onboarding/create-organization/page.tsx`, `actions/onboarding.ts` | N | Unit for the action; unverified email gets "verify your email" | 6 h |
| B7 | **Live Business OS for tenants (minimal)** — customers + tasks (+ products/services if time) persisted for tenant orgs. Per ADR-015, reuse `cos_contacts`, `cos_tasks` (have `organization_id` + member RLS) behind a tenant-mode loader, or add generic tables. Replace demo stores only for tenant mode | A6 | `packages/company-os`, `apps/website/app/os/customers`, `app/os/work`, loaders in `lib/os-home` | Maybe (if new tables) | **Spec §15-1/9:** tenant A cannot read/write tenant B customers/tasks; anon denied | 10 h |
| B8 | **RI SPACE + RINPO on trial** — rename public strings to RI SPACE; trial banner (days left, convert CTA); RINPO "What needs my attention?" deterministic summary over B7 data; no LLM required | B3, B7 | `apps/website/app/space/*`, `lib/rinpo-phone`, `lib/os-home/loaders` | N | Component tests; RINPO works with model gateway disabled | 5 h |
| B9 | **First-value persistence** — `first_value_events` (unique per org + definition + idempotency key); record "first customer + first task" via existing evaluator; Control Plane column | B7 | new migration; `packages/platform/src/first-value.ts` callers | Y, additive | Idempotent record; cross-tenant read denied | 4 h |
| B10 | **Capability truthfulness for launch** — set `payment_checkout`, `whatsapp_notify` to the evidence-backed status; fix `isLive()`; add trial entitlement to `rinaspace-capabilities.ts` gating | — | `apps/website/lib/availability.ts`, `rinaspace-capabilities.ts` | N | Registry tests | 2 h |
| B11 | **Executable security tests** — spec §15 items 1, 2, 3, 4, 6, 9 against local Supabase using the A5 harness | A5, B2–B7 | `tests/rls/*` | N | (these are the tests) | 8 h |
| B12 | **E2E trial journey** (Playwright, local stack): signup → verify (Supabase inbucket) → onboarding → provisioning → `/space` → RINPO → first customer + task → logout/login → test-clock expiry → read-only | B6, B8, B9, B5 | `tests/e2e/trial.spec.ts` | N | (this is the test) | 6 h |
| B13 | **CTA flag + docs** — `trial_signup_enabled` flag (off); update `PLATFORM-READINESS.md`, `readiness.json`, `SELF-SERVE-7-DAY-TRIAL.md` | all | flags, docs | N | — | 2 h |

---

## Capacity check

| | Hours |
|---|---|
| Release A tail (A1–A6) | 13 |
| Release B (B1–B13) | 74 |
| **Total** | **≈ 87** |

That is roughly **11 engineer-days** against a 6-day window (plus 5 days of A tail). It does not fit one engineer at a sustainable pace. Options, in order of preference:

1. **Parallelise** with two agent sessions on separate branches: stream 1 = B1, B2, B3, B4, B5 (data/entitlement); stream 2 = A5, B7, B9, B11 (Business OS + tests); then B6, B8, B12 together. Merge order follows the dependency column.
2. **Cut to the critical path** if needed: defer B9 (persist first value in Release C), use an app-layer write guard instead of RLS for B5 (≈ 4 h saved, but spec §15-6 then rests on app code — record as a known gap), and limit B7 to customers + tasks only.
3. **Do not cut** A1, B2, B3, B4, B11: these are the security and entitlement core.

Release C (billing conversion) depends on founder configuration Q4; it can start in parallel with B as soon as Razorpay test keys exist.
