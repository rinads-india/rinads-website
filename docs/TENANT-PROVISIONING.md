# Tenant provisioning

Phase 11 introduces auditable tenant provisioning via `provision_tenant` RPC and in-memory seed fallback.

## Flows

1. **Platform admin** (`apps/platform-admin`) — founder provisions tenant with name, slug, template, plan.
2. **Website onboarding** (`/onboarding/create-organization`) — authenticated user self-service provision.
3. **Demo mode** (`USE_DEMO_STORE=1`) — seeds org-scoped memory via `@rinads/platform` `seedTenantBundle`.

## RPC

`provision_tenant(p_name, p_slug, p_template_key, p_plan_key)` creates:

- `organizations` row via `create_organization`
- `organization_settings` with `vertical_key`
- `organization_subscriptions` with plan attachment
- `tenant_provisioning_jobs` row (pending)
- `audit_logs` entry

## Vertical templates

| Key | Description |
|-----|-------------|
| `ambady-nursery` | Ambady catalog + inventory ledger seed |

## Status

- SQL seed jobs: **PARTIAL** — app-layer seed runs synchronously after RPC
- Async worker for `tenant_provisioning_jobs`: **PARTIAL** — schema + helpers in `@rinads/platform/runtime-jobs`

## Ambady Tenant #1 cutover (staging)

1. Apply all migrations through `20260816100001_rls_complete.sql` (see `docs/deployment/SUPABASE_MIGRATIONS.md`).
2. Provision or confirm org slug `ambady`:
   - Platform admin → Provision tenant (slug `ambady`, template `ambady-nursery`), or
   - `provision_tenant('Ambady Nursery', 'ambady', 'ambady-nursery', 'growth')`
3. Seed app-layer catalog + ops ledger for the real org UUID:
   ```bash
   USE_SUPABASE=1 pnpm staging:ambady-seed -- --org-id <organization-uuid>
   ```
4. Demo/local without Supabase:
   ```bash
   USE_DEMO_STORE=1 pnpm staging:ambady-seed
   ```
5. Verify: owner portal lists inventory; platform admin shows tenant `active`.
