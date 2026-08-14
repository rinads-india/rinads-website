# Phase 1 — CORE migrations runbook

## Prerequisites

- Supabase project for **staging** (not production until verified)
- Access to project URL + anon key + service role (server only)

## Steps

1. Review [`supabase/migrations/20260814223650_core_identity.sql`](../../supabase/migrations/20260814223650_core_identity.sql)
2. Link CLI: `pnpm dlx supabase link --project-ref <ref>`
3. Push: `pnpm dlx supabase db push`
4. Verify in Table Editor: `profiles`, `organizations`, `organization_members`, `roles`, `permissions`, `audit_logs`, `feature_flags`
5. Verify RLS enabled on all public tenant tables
6. Set website env (`NEXT_PUBLIC_AUTH_PROVIDER=supabase` + URL + anon key)
7. Test signup → profile row created; create org via `create_organization` RPC / server action
8. Confirm cannot assign `founder` / `super_admin` from client

## Rollback

Prefer forward-fix migrations. If needed, restore from Supabase backup; do not drop auth.users casually.

## Production

Only after staging verification and Founder approval. Never share prod DB with marketing preview service-role usage.
