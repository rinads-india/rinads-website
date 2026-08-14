# RINADS Platform

Monorepo for the RINADS business technology ecosystem.

**Public Experience** lives in [`apps/website`](./apps/website) (formerly `rinads-website`).

```text
RINADS/
├── apps/
│   └── website/          # Public Experience + RINPO UI
├── packages/
│   ├── brand/
│   ├── ui/               # skeleton (shadcn deferred)
│   ├── shared/
│   ├── auth/             # interfaces only (Phase 0)
│   ├── permissions/      # types only (Phase 0)
│   └── database/         # code boundary only (Phase 0)
├── supabase/             # schema home — NOT LIVE in Phase 0
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

See [`docs/README.md`](./docs/README.md).

## Deploy

See [`docs/deployment/POLICY.md`](./docs/deployment/POLICY.md). Do not use emergency prod deploy as the default workflow.
