# Feature flags

Phase 11 seeds platform flags in `20260816100000_platform_saas.sql`:

- `commerce.enabled`
- `erp.inventory`
- `erp.procurement`
- `erp.fulfilment`
- `rinpo.ops`

## Evaluation

`@rinads/tenancy`:

- `evaluateFeatureFlags()` — DB definitions + org/user overrides
- `planFeatureFlags()` — plan-based defaults when overrides unavailable
- `isModuleEnabled()` — module route gates

## Platform admin

`/tenants/[id]/flags` shows effective flags (plan-based in demo; DB overrides when wired).

## Status

Per-org override UI writes: **PARTIAL** — read-only viewer in Phase 11.
