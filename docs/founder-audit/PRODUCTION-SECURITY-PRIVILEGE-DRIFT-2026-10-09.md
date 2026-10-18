# Production Security Privilege Drift Audit — 2026-10-09

Status: **P0 / draft remediation only**

Production project verified during a read-only audit:

- Supabase project name: `rinads-platform`
- Supabase project ref: `zznigagovilnffyzcrlj`
- Region: `ap-south-1`
- Health: `ACTIVE_HEALTHY`

No production mutation was performed as part of this audit.

## Root cause

Production PostgreSQL default privileges for functions in `public` grant `EXECUTE` directly to `anon`, `authenticated`, and `service_role`.

That matters because several historical migrations used the pattern:

```sql
REVOKE ALL ON FUNCTION some_function(...) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION some_function(...) TO intended_role;
```

`PUBLIC` is a PostgreSQL pseudo-role; revoking from `PUBLIC` does **not** remove a separate grant already held by `anon` or `authenticated`. Production ACL inspection confirmed this drift. For example, functions whose source migrations intended narrower access still had direct `anon`/`authenticated` execute grants.

## Evidence-backed examples

### `assign_service_order(uuid)`

Repository migration intent:

```sql
REVOKE ALL ON FUNCTION assign_service_order(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION assign_service_order(UUID) TO service_role;
```

Production ACL at audit time nevertheless granted `EXECUTE` to `anon`, `authenticated`, and `service_role`.

### `create_organization(text,text)` / `provision_tenant(...)`

Repository migration intent grants execution to authenticated application users after revoking Public. Production still exposed these functions to `anon` because of the direct default grant.

### Runtime worker RPCs

`claim_runtime_jobs(uuid,integer)` and `reset_stale_runtime_jobs(uuid,integer)` are described by their migration as worker operations where the service role bypasses RLS. Production direct grants exposed both to client roles and the functions lacked a pinned `search_path`.

## Production advisor snapshot

The audit observed:

- 39 RLS-enabled tables with no policy. This requires classification, not blind policy creation: some tables may intentionally be service-role/server-only, where deny-all client access is correct.
- 10 mutable/unset function `search_path` findings.
- `btree_gist` installed in the `public` schema.
- 41 SECURITY DEFINER functions executable by `anon`.
- 42 SECURITY DEFINER functions executable by `authenticated`.
- leaked-password protection disabled.

## Verified RINPO production foundation

The production database already contains RLS-enabled runtime/intelligence tables including:

- `rinpo_conversations`
- `rinpo_memory_facts`
- `rinpo_actions`
- `rinpo_audit_log`
- `rinpo_embeddings`
- `rinpo_training_jobs`
- `runtime_approvals`
- `runtime_jobs`
- workflow/runtime persistence tables

This verifies the schema foundation, but **does not** certify unrestricted production readiness.

## Remediation in this branch

Migration `20261009020000_production_security_privilege_drift.sql` takes a conservative first step:

1. Keeps a named anonymous allowlist for intended public salon/service-order RPCs.
2. Removes `anon`/`PUBLIC` execution from every other public SECURITY DEFINER function.
3. Removes client execution from SECURITY DEFINER trigger functions.
4. Restores service-role-only access for service-order assignment and runtime job claim/reset.
5. Restores the documented authenticated/service-role grants for interactive loyalty RPCs while removing anonymous access.
6. Pins the mutable `search_path` values identified by the production advisor.
7. Fails closed if anonymous SECURITY DEFINER drift remains outside the allowlist.

The migration deliberately **does not**:

- apply itself to production;
- change RLS policies on the 39 no-policy tables;
- change Auth leaked-password settings;
- relocate extensions;
- rotate credentials;
- alter Founder/RINPO production approval policy.

Those require separate evidence and founder approval.

## Required pre-production validation

Before this migration is eligible for production:

- apply it to a disposable/dev Supabase branch or equivalent isolated database;
- run the entire migration chain from clean state;
- run Supabase security advisor again;
- verify public booking, public salon discovery, feedback and public service-order status flows;
- verify authenticated tenant creation/status operations still enforce application permissions;
- verify runtime worker can claim/reset jobs only with trusted service credentials;
- verify R Glow loyalty flows under admin/manager/staff permission combinations;
- verify triggers still fire after trigger-function EXECUTE revocation;
- run cross-tenant isolation tests;
- inspect the remaining authenticated SECURITY DEFINER list and classify each RPC;
- enable leaked-password protection through supported Auth configuration;
- obtain founder approval before merge/promotion.

## Go / no-go

**NO-GO for unrestricted multi-tenant production expansion until P0 function privilege drift and tenant-isolation evidence are closed.**

RINPO feature development may continue in isolated branches/previews, but new production execution powers should remain gated until this control-plane security work is verified.
