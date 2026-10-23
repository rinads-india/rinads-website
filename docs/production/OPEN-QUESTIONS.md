# Open questions for the founder — Release A audit (23 Oct 2026)

Each item blocks something specific. Engineering defaults are stated where one exists, so work can proceed unless the answer differs.

---

## Q1 — Production migration ledger (blocks every Release B migration)

**Why:** `apps/website/app/onboarding/actions/onboarding.ts` tolerates missing Industry Registry tables "until the production migration ledger is reconciled". This audit did not connect to production.

**Need:** a read-only diff between `supabase/migrations/` (69 files, last `20261022180000_logistics_provider_recovery.sql`) and the production project's applied migrations.

**Exact steps (read-only):**
```bash
pnpm dlx supabase link --project-ref <production-ref>
pnpm dlx supabase migration list          # local vs remote; changes nothing
```
Also confirm **which project ref is production** for `www.rinads.com`. The repo's `supabase/config.toml` says `zznigagovilnffyzcrlj`; the cutover doc mentions `wqhhhouzattipxjarlji` (RINGLOW, inactive) and `zfteukmrxdlmngvfxgpl` (rinads-one-dev).

**Default:** no B migration leaves local/preview until this is answered.

## Q2 — R GLOW database

RINGLOW (`wqhhhouzattipxjarlji`) was INACTIVE on 22 Oct and could not be restored because of the project limit.

**Options:** (a) upgrade the Supabase plan/limit and restore; (b) migrate R GLOW onto the canonical RINADS production database (spec §15 R GLOW gate prefers this); (c) keep R GLOW out of the 14 Nov launch.
**Default:** (c) for launch, (b) as Release D.

## Q3 — Is `payment_webhook_events` readable in production? (P0-1)

If the table exists in production without RLS, the Data API may have exposed stored Razorpay payloads to anyone with the anon key.

**Check (read-only, SQL editor):**
```sql
select relrowsecurity from pg_class where oid = 'public.payment_webhook_events'::regclass;
select grantee, privilege_type from information_schema.role_table_grants
 where table_name = 'payment_webhook_events';
```
If `relrowsecurity` is false and `anon` has SELECT: apply fix A1 immediately (needs your approval to push), then review API logs for anon reads of that table.

## Q4 — Razorpay configuration (blocks Release C conversion)

Per `docs/production/MVP-CUTOVER-2026-10-22.md`, each deploy environment needs:

| Variable / item | Where | Note |
|---|---|---|
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | owner-portal, platform-admin (server only) | Test keys for preview/staging |
| `RAZORPAY_WEBHOOK_SECRET` | platform-admin, `payment-webhook` edge function | |
| Plan IDs + billing-cycle counts for starter / growth / platform | owner-portal server env (see `apps/owner-portal/lib/billing-plans.ts`) | Must be created in the Razorpay dashboard first |
| Webhook endpoint | Razorpay dashboard → `https://<platform-admin-host>/api/webhooks/razorpay` | Enable subscription.* events |

**Also decide:** trial prices. The spec's START/GROW/SCALE/ENTERPRISE tiers do not match the code's starter/growth/platform plans. **Default:** keep code keys for launch; map display names (START = starter, GROW = growth, SCALE = platform).

## Q5 — Legal pages (P0-7)

Terms, Privacy, Cookies, DPA and Subprocessors are structural placeholders. A public signup collects personal data, so India's DPDP Act 2023 applies.
**Need:** counsel-approved copy, or a decision to launch the trial only to an invited list until it exists.
**Default:** trial CTA stays off until Terms + Privacy are final; signup records acceptance version.

## Q6 — Email confirmation

Trial eligibility requires a verified email. **Need:** confirm "Confirm email" is enabled in the production Supabase Auth settings and that the SMTP sender is configured (Supabase's default sender is rate-limited and not for production).

## Q7 — Spec deviations needing a decision

1. **RLS FORCE (spec §5):** no table is forced today. Forcing RLS on tables written by SECURITY DEFINER functions owned by the table owner changes their behaviour. **Default:** amend spec §5 to "FORCE where no definer function writes the table", review case by case after launch.
2. **Status vocabulary:** code uses AVAILABLE / PREVIEW / PRIVATE_PREVIEW / COMING_SOON / ROADMAP and `live`/`preview`; spec uses LIVE / READY / BETA / PREVIEW / BLOCKED / PLANNED. **Default:** migrate in Release B task B10 and the registry consolidation after launch.
3. **Business OS tables for tenants (ADR-015):** reuse `cos_*` (already org-scoped with member RLS) or create generic kernel tables. **Default:** reuse `cos_contacts` and `cos_tasks` for launch.

## Q8 — Engineering capacity

Release A tail + B ≈ 87 hours against the window to 3 Nov. **Need:** approval to run two parallel agent sessions, or the cuts listed in `RELEASE-B-TASKS.md` § Capacity check.
