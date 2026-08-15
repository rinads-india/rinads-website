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
