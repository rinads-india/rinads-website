# RI LABS Commercial Persistence Contract

Status: migration design; not applied to Supabase

## Why this is separate from `organization_subscriptions`

The existing SaaS control plane models one plan attachment per organization and is already used as the fail-closed entitlement gate for tenant provisioning. Global RINADS commerce needs an organization to hold multiple products at once: core subscription, Industry Packs, capability packs, integrations, services, training and RI/usage credits.

Do not overload or weaken `organization_subscriptions`. Preserve it for the current platform-plan lifecycle until a deliberate compatibility migration exists.

## Proposed persistence model

### `catalog_products`

Server-owned product identity and release state.

- `key text`
- `version text`
- `name text`
- `product_type text`
- `status text` (`draft`, `published`, `retired`)
- `capability_keys jsonb`
- `first_value_definition jsonb`
- timestamps
- primary/unique identity: `(key, version)`

### `catalog_offers`

Commercial configuration for a product release.

- `id uuid`
- `product_key text`
- `product_version text`
- `key text`
- `catalog_version text`
- `status text` (`draft`, `active`, `retired`)
- `billing_mode text` (`one_time`, `subscription`, `usage`)
- `provider_routes jsonb`
- `requires_tenant boolean`
- `plan_key text null`
- `provisioning_template text null`
- `limits jsonb`
- timestamps
- unique: `(product_key, product_version, key, catalog_version)`

Provider routes are trusted server configuration and may contain provider, market and currency allow-lists. Prices/provider price IDs should be stored here or in a normalized child table if commercial complexity grows.

### `organization_entitlements`

Immutable/snapshotted commercial rights granted to a tenant from trusted catalog resolution.

- `id uuid`
- `organization_id uuid`
- `product_key text`
- `offer_key text`
- `catalog_version text`
- `product_version text`
- `status text` (`pending`, `active`, `suspended`, `expired`, `revoked`)
- `billing_provider text`
- `provider_reference text`
- `purchase_intent_id text`
- `manifest jsonb`
- `starts_at timestamptz`
- `ends_at timestamptz null`
- timestamps

The `manifest` is a server-generated snapshot containing capability keys, limits, provisioning template, tenant requirement and first-value definition. Browser/provider metadata must never provide those privileges.

Recommended uniqueness depends on commercial semantics. At minimum, provider reference and purchase intent must be idempotent; recurring subscription renewals should update lifecycle without duplicating the logical entitlement.

### `activation_events`

Append-only evidence for the commercial activation state machine.

- `id uuid`
- `organization_id uuid`
- `product_key text`
- `offer_key text`
- `purchase_intent_id text`
- `state text`
- `source text` (`billing`, `entitlement`, `provisioning`, `runtime`, `operator`)
- `provider_event_id text null`
- `idempotency_key text`
- `metadata jsonb`
- `created_at timestamptz`
- unique tenant/event idempotency key

Never store secrets or raw sensitive provider payloads in generic metadata. Keep only the evidence needed for audit/reconciliation.

### `first_value_events`

Business-outcome activation telemetry.

- `id uuid`
- `organization_id uuid`
- `product_key text`
- `event_key text`
- `definition_version text`
- `source text`
- `idempotency_key text`
- `properties jsonb`
- `occurred_at timestamptz`
- `created_at timestamptz`
- unique: `(organization_id, idempotency_key)`

## RLS / grants model

All tables live under explicit least-privilege grants and RLS if placed in `public`.

### Catalog

Normal users may read only published products / active offers required by the storefront. Client roles receive no direct insert/update/delete grants. Founder/platform administration uses server-side privileged paths with separate permission checks.

### Organization entitlements

Authenticated organization members may read entitlements for organizations they belong to using the existing `private.is_org_member(organization_id)` helper. Client-side writes are forbidden. Billing/service workers perform lifecycle writes server-side.

### Activation + first value

Organization members may receive read access if needed for owner-facing activation/status UI. Writes occur through trusted server-side ingestion/orchestration only. Do not create permissive authenticated insert policies for billing or runtime evidence.

## Required indexes

- active catalog lookup by product/status/version
- offer lookup by product/status/catalog version
- organization entitlements by `(organization_id, status)`
- provider reference lookup
- purchase intent lookup
- activation events by `(organization_id, product_key, created_at)`
- first-value events by `(organization_id, product_key, occurred_at)`

## Migration security requirements

Before this becomes a migration:

1. Generate the migration using the repository's Supabase CLI workflow; do not invent a migration-history entry manually.
2. Enable RLS on every exposed table.
3. Revoke default `anon` / `authenticated` privileges, then grant only required operations.
4. Use operation-specific policies and both `USING` + `WITH CHECK` for any authenticated update path.
5. Do not add a `SECURITY DEFINER` helper merely to make RLS pass.
6. Add RLS allow/deny database tests for cross-tenant reads and all writes.
7. Run Supabase advisors before committing the migration.
8. Verify provider/event uniqueness and retry behavior against concurrency.

## Compatibility path

For existing R GLOW / platform subscriptions:

1. Keep current `billing_subscriptions` and `organization_subscriptions` authoritative for the active platform plan.
2. Introduce catalog products/offers in parallel as trusted commercial metadata.
3. On verified provider events, resolve catalog policy and create/update `organization_entitlements`.
4. Continue mirroring an active core SaaS plan into `organization_subscriptions` while the current provisioning worker depends on it.
5. Enqueue tenant provisioning only after both the legacy core-plan gate and the new catalog entitlement agree where applicable.
6. Migrate runtime authorization from broad plan modules to catalog entitlement manifests incrementally.

## Activation transaction boundary

Desired server-side transaction/orchestration semantics:

`verified provider event -> resolve trusted offer -> upsert entitlement idempotently -> append activation evidence -> enqueue provisioning/install job -> return provider acknowledgement`

A worker then advances:

`provisioning -> pack installed -> RINPO onboarding -> first-value evidence -> active`

Every step has an idempotency key and an observable failure/retry state. A provider retry cannot create a second organization, entitlement, pack install or first-value record.

## Metrics derived from persistence

- paid -> entitlement latency
- entitlement -> tenant-ready latency
- tenant-ready -> first-value latency
- paid -> first-value p50/p95
- self-serve activation rate
- activation failures by state/provider/product
- manual intervention rate
- first-value completion by product/offer/market
- active entitlements and expansion per organization
