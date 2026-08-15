# Vertical Marketplace

Phase 12 introduces a DB-backed vertical template registry with code fallback.

## Tables

- `vertical_templates` — published vertical keys (`ambady-nursery`, `generic-retail`)
- `vertical_template_versions` — immutable version audit rows

## Flow

1. Founder opens platform-admin **Templates** or provisions via **Tenants → Provision**
2. `provision_tenant` RPC validates `p_template_key` against published templates
3. Async job in `tenant_provisioning_jobs` seeds commerce + ops via worker (`pnpm provisioning:worker`)

## Templates

| Key | Description |
|-----|-------------|
| `ambady-nursery` | Full Ambady catalog + ERP starter |
| `generic-retail` | Minimal single-SKU retail starter |

## API

- `@rinads/platform` — `loadPublishedTemplates`, `TemplateMarketplaceService`, `seedTenantBundle`
