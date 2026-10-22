# RINADS Agent Order Read

Status: **implemented in source / default off**

`commerce.order.read` is the second executable RINADS Agent Gateway READ capability. It extends the same authorization kernel used by `commerce.catalog.read` and establishes a tenant-owned order proof that can later be reused before shipment tracking is exposed.

## Surfaces

- REST: `GET /api/v1/agent/order?order_id=<uuid>`
- MCP: `rinads.commerce.order.read`

## Required gates

A request succeeds only when all of the following are true:

1. the Supabase session or bearer identity is valid;
2. RINADS resolves the organization server-side from active membership evidence;
3. the principal has `commerce.order.read`;
4. `agent.commerce.order.read` is explicitly enabled for the organization or actor;
5. all data access uses the caller's normal Supabase user context, never service-role;
6. the parent `orders` query explicitly filters by the resolved `organization_id` and requested order UUID;
7. existing RLS independently verifies organization membership;
8. child `order_lines` and `order_events` are visible only through the tenant-owned parent order policy;
9. append-only audit evidence is successfully written before order data is released.

The feature flag definition is seeded with `default_enabled = false` and no tenant/user override, so merging or deploying this code grants no external order access by itself.

## Data minimization

The external projection includes operational order state, amounts, currency, shipping method code, promotion code, line-item product/SKU/quantity/price values and non-sensitive order events.

It deliberately excludes:

- `customer_id`;
- `guest_email`;
- customer profiles;
- addresses;
- phone numbers;
- payment provider/reference records;
- credentials or carrier tokens.

The executor rejects undeclared arguments, including `organization_id` and `include_payments`.

## Audit model

Agent Gateway reads are authorized by an authenticated RINADS user, so audit rows use `actor_type='user'` and the authenticated actor ID. AI-channel provenance is recorded separately through `source=agent-gateway:<auth-method>` plus `agent_channel=true` metadata. This matches existing `audit_logs` RLS instead of granting a new broad insert policy for AI actors.

## Why this comes before shipment tracking

An arbitrary AWB is not sufficient proof that a shipment belongs to the resolved tenant. The next logistics slice should first resolve a tenant-owned internal shipment/order under RLS, obtain the stored provider/AWB from that owned record, and only then invoke the normalized Shiprocket tracking client.

Carrier writes, cancellation, checkout, campaign launch, outbound messaging and payment operations remain disabled.
