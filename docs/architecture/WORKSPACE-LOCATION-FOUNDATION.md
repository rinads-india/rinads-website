# Workspace + Shared Location Foundation (PR-K2)

Implements the additive hierarchy accepted in ADR-013:

```text
Organization (security / tenant boundary)
  -> Workspace (business unit / operating context)
      -> Location (physical or operational site)
```

## Security boundary

`organization_id` remains the tenant boundary. Workspace and location are subordinate scopes only; they do not replace organization membership or organization-level RLS.

All workspace/location reads require organization membership. Mutations require `org.manage`. No authenticated hard-delete policy is provided; archive records instead.

## Backward compatibility

This phase does **not** alter or backfill:

- `inventory_locations`
- salon branch/location tables
- existing commerce/operations records
- current active-organization session/cookie behaviour

Each existing organization receives one default workspace. New organizations receive a default workspace from an `organizations` insert trigger.

## Shared location model

`public.locations` stores a common platform location identity with:

- organization
- workspace
- name/code
- kind/status
- structured address metadata
- optional coordinates/timezone
- extensible metadata

The composite foreign key `(workspace_id, organization_id) -> workspaces(id, organization_id)` prevents a location from attaching to another tenant's workspace even if application code passes a mismatched pair.

## Existing domain locations

`inventory_locations` and salon branches remain domain-specific operational records for now. A later migration may add explicit mapping/reference columns once the required workflows are proven. K2 intentionally avoids a mass rewrite.

## Application types

`@rinads/tenancy` exports `WorkspaceScope` and `PlatformLocationScope` plus pure scope checks. These are defense-in-depth helpers; database RLS/composite foreign keys remain authoritative.

## Migration

Repository migration:

`supabase/migrations/20261005100000_platform_workspaces_locations.sql`

The migration is committed for review/CI only. Applying it to production remains a founder/ops action under the existing deployment policy.

## Verification

K2 adds tests for:

- same-organization workspace scope
- cross-organization workspace rejection
- cross-organization location rejection
- same-org/wrong-workspace rejection
- composite same-org database foreign key
- RLS membership/permission policy presence
- no authenticated hard-delete policy
- no mutation of legacy inventory/salon location schemas

## Next

PR-K3 will harden canonical inventory availability and stop treating scalar `product_variants.stock` as authoritative in checkout/operations paths.
