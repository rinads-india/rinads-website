# Tenant lifecycle

Platform operators can suspend, archive, or reactivate tenants.

## RPC

`set_organization_status(p_org_id, p_status)` — values: `active`, `suspended`, `archived`.

Writes `audit_logs` on each transition.

## Enforcement

- `@rinads/tenancy` `requireOrgActive()` blocks portal access for suspended/archived orgs.
- RLS policies remain the authoritative enforcement layer in Supabase mode.

## Platform admin

`/tenants/[id]` exposes suspend/reactivate actions (service role in Supabase mode).
