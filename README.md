# RINADS Platform

Monorepo for the RINADS business technology ecosystem: Public Experience, SaaS control plane, omnichannel commerce/ERP, salon vertical **R GLOW**, and intelligence layer **RINPO**.

**Current status:** see [`docs/STATUS.md`](./docs/STATUS.md) (Phases 9–13 + R GLOW MVP are on `main`).

```text
RINADS/
├── apps/
│   ├── website/           # Public Experience + Services + RINPO UI
│   ├── rinaglow/          # R GLOW Salon OS (glow.rinads.com)
│   ├── storefront/        # Omnichannel shop
│   ├── customer-portal/   # Customer account
│   ├── owner-portal/      # Merchant ERP UI
│   └── platform-admin/    # Founder control plane + CMS
├── packages/              # Shared platform libraries
├── supabase/              # Migrations + Edge Functions
├── scripts/               # Cron workers + staging tools
├── docs/
└── tests/
```

## Develop

```bash
pnpm install
pnpm dev
```

## Verify

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Documentation

- **Status:** [`docs/STATUS.md`](./docs/STATUS.md)
- **Index:** [`docs/README.md`](./docs/README.md)
- **R GLOW cutover:** [`docs/deployment/RGLOW_PRODUCTION_CUTOVER.md`](./docs/deployment/RGLOW_PRODUCTION_CUTOVER.md)

## Deploy

See [`docs/deployment/POLICY.md`](./docs/deployment/POLICY.md). Do not use emergency prod deploy as the default workflow.
