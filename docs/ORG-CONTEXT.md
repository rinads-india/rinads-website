# Organization context

Tenancy is resolved server-side — not from client localStorage.

## `@rinads/tenancy`

| Module | Purpose |
|--------|---------|
| `load.ts` | `resolveTenancyFromSupabase`, `buildDemoTenancyContext` |
| `context.ts` | `toCommerceContext`, `toOperationsContext`, guards |
| `org-switch.ts` | httpOnly cookie `rinads_active_org` |

## Portal pattern

Each commerce app (`storefront`, `customer-portal`, `owner-portal`) includes:

- `middleware.ts` — Supabase session refresh
- `lib/tenancy.ts` — resolves active org from session + cookie
- `lib/commerce.ts` — `getCommerceContext()` / `resolveOwnerContext()` with `USE_DEMO_STORE` fallback

## Demo fallback

When `USE_DEMO_STORE=1` or Supabase auth is not configured, portals use `buildDemoTenancyContext()` with Ambady demo org.
