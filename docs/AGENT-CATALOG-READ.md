# RINADS Agent Catalog Read

Status: **implemented in source / default off**

`commerce.catalog.read` is the first RINADS capability allowed to cross from authenticated Agent Gateway identity into tenant business data. It is deliberately read-only and is available through both REST and MCP so authorization does not depend on the calling AI channel.

## Surfaces

- REST: `GET /api/v1/agent/catalog?query=<optional>&limit=<1..50>`
- MCP: `rinads.commerce.catalog.read`

## Required gates

A request succeeds only when all of the following are true:

1. Supabase session or bearer identity is valid.
2. RINADS resolves the organization server-side from active membership evidence.
3. The principal has `commerce.catalog.read`.
4. `agent.commerce.catalog.read` is explicitly enabled for that organization or actor.
5. Queries execute through the caller's normal Supabase user context; service-role access is prohibited.
6. Every product/variant query also filters by the resolved `organization_id`.
7. Existing commerce RLS independently verifies active organization membership.

The feature flag definition is seeded with `default_enabled = false`. The migration does not create any organization/user override, so deploying the code alone exposes no tenant catalog to an external agent.

## Data projection

Only published products and active variants are projected. The response is intentionally limited to catalog attributes such as product/variant identifiers, names, descriptions, categories, tags, ratings, SKU, stored price values, stock, weight and status.

The capability does not return customers, addresses, phone numbers, email addresses, orders, payment records, credentials or provider secrets.

## Tenant isolation

External callers cannot supply `organization_id`. The REST endpoint has no organization selector. The MCP input schema accepts only `query` and `limit`, and the executor rejects every undeclared argument rather than silently ignoring it.

A multi-organization bearer identity remains blocked until RINADS issues organization-bound delegation/OAuth credentials.

## Why shipment tracking is not enabled yet

Shiprocket tracking reads exist internally, but accepting an arbitrary AWB from an external agent could reveal tracking evidence for a shipment that has not first been proven to belong to the resolved tenant. `logistics.shipment.track` therefore remains fail-closed until RINADS binds shipment ownership lookup before carrier tracking.

## Next read-only gates

1. tenant-owned order read;
2. tenant-owned shipment tracking;
3. normalized shipping quote read;
4. governed business summary read;
5. immutable audit/event evidence for external agent reads where required by policy.

Mutation, checkout, campaign launch, outbound messaging and carrier write capabilities remain disabled until their approval, idempotency and audit contracts are implemented.
