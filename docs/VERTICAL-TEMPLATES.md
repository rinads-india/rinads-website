# Vertical templates

Templates parameterize Ambady seed data for new tenants.

## Registry

`@rinads/platform` `VERTICAL_TEMPLATES`:

| Key | Name |
|-----|------|
| `ambady-nursery` | Ambady Nursery & Garden |
| `generic-retail` | Generic Retail |
| `salon-os` | Salon OS — branches, services, staff, and appointment booking (`@rinads/salon`, `@rinads/salon-server`, `apps/rinaglow`). The commerce/operations seed bundle is an empty starting point; real operational data lives in the `salon_*` tables, set up interactively by the owner. |

## Seed bundle

`seedTenantBundle(orgId, templateKey)` remaps:

- `@rinads/commerce-server` Ambady catalog
- `@rinads/operations-server` Ambady ops ledger

Clears transactional rows (orders, POs, fulfilments) for fresh tenants.

## Ambady Tenant #1

`migrateAmbadyTenantSeed({ organizationId })` re-seeds under real org UUID with slug `ambady`.

See `docs/PHASE_11_COMPLETION_REPORT.md` for cutover steps.
