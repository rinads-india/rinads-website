# Supabase migration and rollback review

**Audit date:** 2026-09-25 (refresh 2026-09-26)  
**Repo migrations:** 31 files under `supabase/migrations/`  
**Production applied status:** **PARTIAL** — full migration list still **BLOCKED** (Supabase MCP `needsAuth`). Live lead API returned `stored: true` on 2026-09-26, so `site_leads` persistence path is live; salon routing / loyalty expiry apply status remains unknown. See [LIVE-E2E-VERIFICATION-2026-09-26.md](./LIVE-E2E-VERIFICATION-2026-09-26.md).

## Policy

- Do **not** apply migrations to production from this agent without explicit founder approval.
- Review order = filename timestamp order.
- Prefer forward-fix migrations over destructive rollbacks in production.

## Inventory (chronological)

| Migration | Purpose (from filename / header) | Rollback note |
|-----------|----------------------------------|---------------|
| `20260814100000_core_tenancy.sql` | Core tenancy stub / early | Historical; superseded by identity |
| `20260814100001_core_identity.sql` | Identity, orgs, roles | Restore from backup only |
| `20260814100002_commerce.sql` | Commerce foundation | — |
| `20260815100001_operations_erp.sql` | ERP operations | — |
| `20260815100002_commerce_rls_operations_rls.sql` | Commerce/ops RLS | Do not drop RLS blindly |
| `20260816100000_platform_saas.sql` | SaaS control plane | — |
| `20260816100001_rls_complete.sql` | Broad RLS | Critical; verify before any revoke |
| `20260817100000_phase12_marketplace_billing_domains.sql` | Marketplace/billing/domains | — |
| `20260818100000_runtime_2.sql` | Runtime | — |
| `20260819100000_runtime_worker_persistence.sql` | Worker persistence | — |
| `20260820100000_site_cms.sql` | CMS | — |
| `20260821100000_onboarding_enabled_modules.sql` | Onboarding modules | — |
| `20260824100000_rinads_services_foundation.sql` | Services foundation | — |
| `20260825100000_seed_services_catalog.sql` | Seed catalog | Re-seed vs delete carefully |
| `20260825100001_fix_assign_service_order.sql` | Service order assign fix | — |
| `20260825100002_staging_partner_assignment.sql` | Staging partner | — |
| `20260826100000_security_hardening.sql` | Security hardening | — |
| `20260827100000_salon_os.sql` | R GLOW / salon OS | Large surface |
| `20260828100000_salon_public_reads.sql` | Public salon reads | Review anon policies |
| `20260901100000_salon_pos_checkout.sql` | POS | — |
| `20260901100001_salon_notes.sql` | CRM notes | — |
| `20260901100002_salon_booking_enhancements.sql` | Booking | — |
| `20260901100003_salon_events_and_rinpo_actions.sql` | Events / RINPO actions | Audit trail related |
| `20260908100000_salon_communications_delivery.sql` | Comms delivery | — |
| `20260908100001_salon_segments_and_campaigns.sql` | Segments/campaigns | — |
| `20260916100000_salon_loyalty.sql` | Loyalty | — |
| `20260916100001_salon_reviews_automation.sql` | Reviews | — |
| `20260916100002_salon_communications_e2.sql` | Comms E.2 | — |
| `20260916100003_fix_salon_vertical_routing.sql` | Salon vertical routing | Required for login→glow |
| `20260921100000_salon_loyalty_expiry.sql` | Loyalty expiry batches | Worker still off by default |
| `20260924100000_site_leads.sql` | Marketing `site_leads` | Deny-all RLS; service-role insert |

## High-priority verification checklist (founder)

- [ ] List applied migrations on **production** project (dashboard or CLI).
- [ ] Confirm `20260916100003_fix_salon_vertical_routing.sql` applied.
- [ ] Confirm `20260921100000_salon_loyalty_expiry.sql` applied if expiry job will be used.
- [x] Confirm `20260924100000_site_leads.sql` / lead persistence live — **API-proven 2026-09-26** (`stored: true`, id `32188892-3852-4389-97bc-c1d06b85a8c8`); optional: confirm/delete row in Table Editor.
- [ ] Confirm Auth redirect allowlist: `www.rinads.com/**`, `rinads.com/**`, `glow.rinads.com/**`.
- [ ] Spot-check RLS: anon cannot SELECT/INSERT `site_leads`; salon tables tenant-scoped.

## Rollback guidance

| Class | Guidance |
|-------|----------|
| Additive tables (`site_leads`) | Safe rollback = stop writers, then `DROP TABLE` only if empty / backed up |
| RLS policies | Restore prior policy SQL from git; never `DISABLE ROW LEVEL SECURITY` in prod as “fix” |
| Seed data | Prefer compensating deletes by known seed IDs |
| Salon communications | Disable workers/flags before schema rollback |

## Edge functions (repo)

`payment-webhook`, `notify-whatsapp`, `notify-whatsapp-webhook`, `morning-digest`, `health-check` — deploy status **BLOCKED** (not verified this audit).

## Companion docs

- `docs/deployment/SUPABASE_MIGRATIONS.md`
- `docs/deployment/RINADS_PLATFORM_STAGING.md`
- `docs/deployment/RGLOW_PRODUCTION_CUTOVER.md`
