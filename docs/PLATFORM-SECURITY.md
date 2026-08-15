# Platform security

## Privileged roles

`founder` and `super_admin` are system-scoped. Assignment remains service-role / DB trigger enforced (CORE migration).

Platform admin middleware calls `requirePrivilegedRole()` server-side.

## Service role

`SUPABASE_SERVICE_ROLE_KEY` is required for platform-admin mutations in Supabase mode.

Never import service-role client in browser bundles.

## RLS

Commerce + operations INSERT/UPDATE/DELETE policies extended in `20260816100001_rls_complete.sql`.

Cross-tenant isolation tests live in `packages/commerce-server/tests/tenant-isolation.test.ts`.

## IDOR

Commerce services enforce customer-scoped reads (orders, tickets) — see `packages/commerce-server/tests/security.test.ts`.
