# Supabase — RINADS system of record (boundary only)

**Phase 0 status: NOT LIVE FOR PRODUCTION BUSINESS DATA.**

This directory is the home for:

- PostgreSQL migrations
- RLS policies
- seeds
- Supabase project configuration

## Rules

1. Schema and migrations live here — **not** inside `packages/*`.
2. `packages/database` is the application code boundary only.
3. Do not connect production Supabase in Phase 0.
4. Do not create CRM / ERP / RINAGLOW / tenant business tables in Phase 0.
5. Never put the service-role key in client / browser code.

## Phase 1+

Identity, organizations, memberships, RBAC, and RLS migrations will be added here under Founder authorization.
