# RI DELIVERY — Persistence, RLS and API release contract

**Status:** DESIGN GATE. This document is not an applied database migration.
**Stack:** Stacked on PR #263; merge only after #263 and independent review.
**Production default:** RI_DELIVERY_READ_API_ENABLED unset/false. No customer data is loaded.

## Shipped code on this branch
- \`GET /api/ri-delivery/jobs\` (owner portal): currently returns 503 until enabled.
  - RI ID identity is resolved from cookie-based Supabase Auth.
  - Tenant comes from trusted active membership, not request headers or query parameters.
  - Requires active organization, owner/staff access and \`logistics.read\`.
  - Returns at most 25 non-sensitive rows: id, status, created_at, updated_at.
  - Uses user-scoped client, NEVER a service-role key.
- \`GET /api/ri-driver/offers\` (website): currently returns 503 until enabled.
  - Requires a non-anonymous Supabase Auth user; driver ID is \`auth.getUser().id\`.
  - Returns only the authenticated user's 20 most recent active offers.
  - Exposes no customer name, phone, precise drop address, proof image or GPS location.
  - Uses user-scoped client, with future RLS enforcing driver ownership.
- Pure read guards and 10 Node tests in the existing \`@rinads/operations\` package.

## Database contract — required, NOT implemented
Do not turn the feature flag on until the following schema exists and security tests pass.

1. **ri_delivery_driver_relations**
   - id, organization_id (FK organizations), driver_user_id (FK auth.users), relationship (client_staff/rinads_staff/freelancer), approved_status, active_status, vehicle_type, licence_verified_at, insurance_verified_at, network_opt_in_at, created_at, updated_at.
   - Immutable identity documents remain in restricted storage, not in publicly readable rows. Store only verification flags, expiry and reference ID.
   - Merchant staff sees relationships only within their organization and authorised logistics scope. A driver sees only their own relation, never other driver details. Driver cannot self-verify by updating a row.
2. **ri_delivery_jobs**
   - id, organization_id, order_id (nullable FK only when canonical order is verified), status, required_vehicle, trip_distance_km, approved_max_payout_minor, merchant_approved_by, approved_at, assigned_driver_user_id, version, created_at, updated_at.
   - Do NOT replicate customer contact, payment instruments, or delivery addresses into this table. Resolve customer-facing details through a short-lived, purpose-specific server endpoint once job accepted.
   - Merchant select policy: \`private.has_permission(organization_id, 'logistics.read')\`. Driver cannot read the entire job table.
3. **ri_delivery_offers**
   - id, organization_id, job_id, driver_user_id, status, payout_minor, expires_at, created_at, updated_at.
   - Composite FK \`(job_id, organization_id)\` references unique \`(id, organization_id)\` in jobs.
   - Merchant SELECT permitted by \`private.has_permission(organization_id, 'logistics.read')\`; driver SELECT permitted only where \`driver_user_id = (select auth.uid())\`.
   - Expired or revoked offers are excluded from active queries. Offer accept/decline must re-check row status, expiry, verified relation and job lock in the same transaction.
4. **ri_delivery_job_events**
   - id, organization_id, job_id, idempotency_key, actor_user_id, event_type, from_status, to_status, policy_snapshot, occurred_at.
   - Unique \`(organization_id,idempotency_key)\`; immutable append-only. Server-side writes only.
5. **ri_delivery_settlement_proposals**
   - id, organization_id, job_id, driver_user_id, amount_minor, currency, status, finance_approved_by, payout_batch_id, created_at, updated_at.
   - Unique source event/job payout, immutable ledger references. No driver-visible bank data.
   - Financial approvals are separate from generation of a proposal; no LLM-triggered transfer.
6. **Proof-of-delivery**
   - Store private object reference and limited metadata; issue short-lived signed URLs only to the driver on their accepted job and authorised merchant staff. Never persist public links.

All tables should also follow the master-spec tenant-owned column requirements (workspace_id, created_by, updated_by, created_at, updated_at), with foreign keys and appropriate indexes.

## Required database security
- New tables: \`ENABLE ROW LEVEL SECURITY\` **and** \`FORCE ROW LEVEL SECURITY\` (except where justified by approved Supabase architecture).
- Explicitly \`REVOKE ALL\` from \`anon\` and \`authenticated\` then grant only necessary \`SELECT\` to authenticated for jobs and offers; **no client INSERT/UPDATE/DELETE grants**.
- Use \`private.has_permission(organization_id, 'logistics.read')\` as already defined in the platform; do not invent another helper or rely on \`user_metadata\`.
- Policies \`TO authenticated\` with a membership/identity predicate; \`TO authenticated\` alone is not authorisation.
- Drivers reading their own offers must not gain access to order detail, customer PII or other drivers through JOINs, REST embedding or views.
- A service-role adapter may perform writes only after independent server-side RI ID/merchant/driver/policy checks and database-atomic version/idempotency checks.
- Reject cross-org linkage, forged organisation IDs, stale job versions and replayed event IDs.
- Revoke all public access to functions created for privileged writes; avoid public \`SECURITY DEFINER\`.
- Do not enable realtime publications for sensitive tables until a separate row-authorization and disclosure review.

## Blocking tests
1. Unauthenticated and anonymous roles cannot SELECT any rows.
2. Merchant A cannot read Merchant B jobs or offers, including by UUID enumeration.
3. Merchant staff without \`logistics.read\` cannot SELECT.
4. A driver sees only their own active offer rows across opted-in businesses.
5. A driver cannot SELECT other drivers, unassigned job addresses or finance payout batches.
6. No authenticated user may INSERT, UPDATE, DELETE or TRUNCATE directly.
7. Duplicate accepted offer / stale version / simultaneous riders fails atomically.
8. Delivery transition requires authentic accepted driver and auditable proof reference.
9. Payout idempotency blocks double payment and settlement without finance approval.
10. API tests verify 503 with flag off, 401 anonymous, 403 missing merchant scope, no cache, and no data leakage in errors.

## Deployment order
1. Run \`supabase migration new ri_delivery_persistence\` using an approved Supabase CLI in the canonical repository.
2. Write an additive SQL migration with explicit grants and policies; do not edit applied migrations.
3. Validate locally with \`supabase test db\`, separate test RI IDs/organisations and SQL explain plans.
4. Apply to a non-production Supabase branch or an authorised staging project; verify security advisors.
5. Deploy feature branch preview, keep \`RI_DELIVERY_READ_API_ENABLED=false\`.
6. Test with real *authorised pilot dummy accounts*, record a signed security checklist.
7. Only then approve the read-only feature flag in a designated pre-production environment.
8. Implement write endpoints separately (offer, accept, decline, pickup, deliver, settlement review) behind RINPO Runtime permission and approval gates.
9. Production migration/activation requires explicit founder release approval.

## Failure & rollback
- Flag OFF immediately restores 503 even when tables exist.
- This branch makes no migration, schema write, payment transfer, customer notification or carrier/API call.
- Use additive rollback only after checking external references; never drop tables with live tenant data.
- Log request/correlation IDs and non-sensitive error codes; do not log JWTs, address strings, bank or identity documents.

## Cost and rollout
Start with Cake Farm's 7-day supervised manual workflow and 1–2 verified vehicles. Existing order count ≠ completed deliveries. Use actual successful drop costs to calibrate fare caps, payout reserves and rider thresholds. Do not enable autonomous dispatch or subscription billing before those numbers are measured.

## Connected Supabase environment audit — 5 November 2026

A read-only inspection of connected Supabase projects revealed:
- \`rinads-one-dev\` is ACTIVE_HEALTHY but its public schema has 38 tables and uses \`tenants\` rather than the canonical monorepo's \`organizations\`; no \`ri_delivery_*\` or \`logistics_*\` tables were present.
- \`RINGLOW\` is INACTIVE.
- Neither connected project was verified as the canonical \`rinads-platform\` production backend.

**Blocker:** Do not run a migration, enable the read-only API feature flag, assign drivers, or create test customer records in these projects based on the current connection alone. First establish the correct staging and production project references through the official environment inventory, compare migration history, and obtain founder approval before applying changes. The discrepancy may reflect older/parallel environments rather than a missing migration in the actual production database.
