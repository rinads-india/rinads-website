# Phase 1 — CORE migrations runbook

## rinads-platform (staging)

See **[RINADS_PLATFORM_STAGING.md](./RINADS_PLATFORM_STAGING.md)** for the live project:

- URL: `https://zznigagovilnffyzcrlj.supabase.co`
- Ref: `zznigagovilnffyzcrlj`
- Push: `bash scripts/supabase/link-and-push.sh` (requires `SUPABASE_ACCESS_TOKEN`)

## RINADS Services foundation (v5.1)

After core migrations, review [`supabase/migrations/20260824100000_rinads_services_foundation.sql`](../../supabase/migrations/20260824100000_rinads_services_foundation.sql) and [SERVICES-MIGRATION.md](../architecture/SERVICES-MIGRATION.md).

Verify: `service_orders`, `service_pods`, `service_partners`, `assign_service_order()`, RINPO audit tables.

## Migration history repair

If foundation SQL was applied manually in the Supabase SQL Editor (without `db push`), repair history before the next push:

```bash
pnpm dlx supabase migration repair --status applied 20260824100000
pnpm dlx supabase migration list
```

Then push remaining migrations: `bash scripts/supabase/link-and-push.sh`

## Edge Functions (Services automation)

Deploy after secrets are set in Supabase (`RAZORPAY_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`):

```bash
pnpm dlx supabase functions deploy payment-webhook notify-whatsapp morning-digest health-check
```

Razorpay dashboard: point `payment.captured` to  
`https://zznigagovilnffyzcrlj.supabase.co/functions/v1/payment-webhook`

## Prerequisites

- Supabase project for **staging** (not production until verified)
- Access to project URL + anon key + service role (server only)

## Steps

1. Review [`supabase/migrations/20260814100001_core_identity.sql`](../../supabase/migrations/20260814100001_core_identity.sql)
2. Link CLI: `pnpm dlx supabase link --project-ref <ref>`
3. Push: `pnpm dlx supabase db push`
4. Verify in Table Editor: `profiles`, `organizations`, `organization_members`, `roles`, `permissions`, `audit_logs`, `feature_flags`
5. Verify RLS enabled on all public tenant tables
6. Set website env (`NEXT_PUBLIC_AUTH_PROVIDER=supabase` + URL + anon key)
7. Test signup → profile row created; create org via `create_organization` RPC / server action
8. Confirm cannot assign `founder` / `super_admin` from client

## Phase 11 — Platform SaaS migrations

After Phase 10 operations migrations:

1. Review [`supabase/migrations/20260816100000_platform_saas.sql`](../../supabase/migrations/20260816100000_platform_saas.sql)
2. Review [`supabase/migrations/20260816100001_rls_complete.sql`](../../supabase/migrations/20260816100001_rls_complete.sql)
3. Push: `pnpm dlx supabase db push`
4. Verify: `plans`, `organization_subscriptions`, `organization_settings`, `tenant_provisioning_jobs`, `organization_invites`
5. Test `provision_tenant` RPC and platform-admin on port 3004

### Generated types

When the Supabase project is linked, regenerate types for CI:

```bash
pnpm dlx supabase gen types typescript --linked > packages/database/src/generated.ts
```

Phase 11 extends hand-maintained types in [`packages/database/src/types.ts`](../../packages/database/src/types.ts) until generated types are wired in CI.

## Rollback

Prefer forward-fix migrations. If needed, restore from Supabase backup; do not drop auth.users casually.

## Production

Only after staging verification and Founder approval. Never share prod DB with marketing preview service-role usage.
