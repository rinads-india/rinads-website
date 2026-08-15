# Custom Domains (Storefront)

Storefront-only custom domains in Phase 12. Owner/customer portals stay on shared hosts.

## Resolution order

1. `{storefront_slug}.store.rinads.com` — wildcard platform domain
2. Verified row in `organization_domains` with status `active` or `verified`

Middleware sets `x-rinads-organization-id` for downstream tenancy.

## Verification

1. Add domain → `verification_token` generated
2. Publish TXT: `_rinads-verify` = token
3. Verify → Vercel Domains API adds host to storefront project

## Env

```bash
VERCEL_TOKEN=
VERCEL_STOREFRONT_PROJECT_ID=
STOREFRONT_PLATFORM_DOMAIN=store.rinads.com
STOREFRONT_CUSTOM_DOMAIN_RESOLUTION=1
```

## Package

`@rinads/domains` — token generation, state machine, Vercel client, host resolver.
