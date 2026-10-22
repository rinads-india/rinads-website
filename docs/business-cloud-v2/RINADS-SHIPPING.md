# RINADS Shipping — provider-routing foundation

Status: foundation / no live carrier credentials enabled.

RINADS Shipping extends the existing `ShipmentService` and `CourierAdapter`. It does not create a parallel logistics/order stack.

## Architecture

```text
Order → Fulfilment → Package
               ↓
        CourierProviderRouter
               ↓
 serviceability + capability + quote
               ↓
       RINADS Intelligence
 cost + ETA + delivery success + RTO
 SLA confidence + margin + priority
               ↓
      authorization / policy gate
               ↓
 selected CourierAdapter
               ↓
      RINPO Runtime execution
               ↓
 Shipment → Tracking → Delivery / Return
```

## Delivered in this slice

- provider-neutral registry/router in `@rinads/operations`
- canonical provider keys for Delhivery, Porter, Shiprocket, Sequel, BVC, DTDC, local fleet and ONDC Delivery
- provider enable/disable state
- operational capabilities: COD, reverse, same-day, scheduled, high-value
- shipment intent now carries pickup/destination PIN, parcel type, dimensions, declared value and COD amount as optional routing evidence
- quote/serviceability contract
- routing strategies: priority, lowest cost, fastest and `intelligence`
- `intelligence` strategy supports governed evidence for delivery success, RTO, SLA confidence and expected margin
- configurable intelligence weights with deterministic fallback/tie-breaking
- maximum-cost and maximum-ETA policy gates
- invalid/missing intelligence telemetry is treated as unknown instead of fabricated
- quote failures become unserviceable evidence rather than fake success
- no shipment is created until a serviceable provider satisfies policy
- Logistics OS operator workspace at `/os/logistics`
- fail-closed provider readiness based on server-side credential presence; no secret values are rendered
- route-intent planner validates PIN/weight/capability needs without inventing rates or AWBs
- tenant provider configuration + routing/autonomy policy migration under RLS
- dedicated `logistics.read`, `logistics.shipment.manage`, `logistics.settings.manage` permissions
- carrier credential bindings persist opaque references only; secret values remain outside PostgreSQL
- append-only `logistics_decision_events` for RI/RINPO recommendation, authorization, action and audit evidence
- tests for price/speed/capability/intelligence routing, failure handling and creation
- Shiprocket API-user credential contract verified against current provider documentation
- Shiprocket server client for token authentication, serviceability/rate evidence, AWB assignment, pickup scheduling, label generation, shipment cancellation and shipment detail reads
- Shiprocket mutations fail closed unless the explicit server-side `writeEnabled` gate is enabled
- Shiprocket bearer tokens are cached server-side and refreshed before the documented 10-day validity window

## RINADS Intelligence / RINPO Runtime boundary

RINADS Intelligence is the control plane. It may rank serviceable provider candidates using governed operational evidence, but it does not bypass authorization policy.

RINPO Runtime is the execution plane. It should call the selected provider adapter, monitor lifecycle events, trigger approved exception workflows and write audit evidence only after RI/policy authorization.

Do not let a conversational RINPO surface directly choose or call a carrier outside this boundary.

## Persistence boundary

`logistics_provider_configs` stores tenant enablement, priority, capabilities, non-secret configuration and an opaque credential binding key. It must never store a DTDC/Delhivery/Porter/Shiprocket token, password or private key.

`logistics_routing_policies` stores tenant strategy, ceilings, intelligence weights and autonomy/approval thresholds.

`logistics_decision_events` is append-only for authenticated actors. It captures the policy/evidence snapshot that explains why RI recommended, authorized or executed a logistics action.

Provider secret values remain in server-side environment/vault/connector infrastructure and are resolved only by the provider adapter at execution time.

## Shiprocket contract

Shiprocket's current seller API requires a dedicated API user. The API user's email plus password/API key is exchanged at `/v1/external/auth/login` for a bearer JWT. Provider documentation states that the token is valid for 10 days.

RINADS secret bindings therefore use:

- `RINADS_SHIPROCKET_EMAIL`
- `RINADS_SHIPROCKET_PASSWORD`

The database continues to store only the opaque binding ID `shiprocket_primary`.

The Shiprocket client is deliberately **not** yet exposed as a complete `CourierAdapter`. The current canonical `CourierAdapter.createShipment()` request only carries order/package IDs, weight and destination PIN, while Shiprocket order creation requires customer address, contact, payment and order-item details. The canonical RINADS shipment execution command must be enriched first rather than inventing or duplicating those values inside a provider adapter.

Shiprocket webhooks should terminate at a provider-neutral RINADS endpoint. Shiprocket's current webhook documentation specifically warns against putting `shiprocket`, `kartrocket`, `sr` or `kr` in the webhook URL and supports an `x-api-key` security token. Keep that constraint when the webhook normalization slice is implemented.

## Important boundary

The provider keys are **not** claims that all carrier APIs are integrated or enabled. Do not use `DemoCourierAdapter` for production fulfilment.

Current carrier credential contract names are intentionally server-only setup metadata:

- `RINADS_DTDC_API_TOKEN`
- `RINADS_DELHIVERY_API_TOKEN`
- `RINADS_PORTER_API_KEY` + `RINADS_PORTER_API_SECRET`
- `RINADS_ONDC_SUBSCRIBER_ID` + `RINADS_ONDC_SIGNING_PRIVATE_KEY`
- `RINADS_SHIPROCKET_EMAIL` + `RINADS_SHIPROCKET_PASSWORD`

Additional provider contracts are defined in `apps/website/lib/logistics-os.ts`. Secret values must never be prefixed with `NEXT_PUBLIC_`.

A `*_LIVE=1` flag must never be set merely because credentials exist. Live status requires the production gate below.

## Next slices

1. enrich the canonical shipment execution command with the customer/address/payment/item data required by real carrier order creation;
2. repository/service adapter that loads tenant provider config + routing policy into `CourierProviderRouter`;
3. map Shiprocket serviceability options into provider-neutral `CourierQuote` candidates for RI ranking;
4. complete the Shiprocket `CourierAdapter` only after the enriched shipment command exists;
5. DTDC adapter against the existing Mannuthy API account + sandbox/controlled contract tests;
6. Delhivery adapter + staging contract tests;
7. Porter Enterprise adapter for local/on-demand delivery;
8. ONDC Delivery protocol adapter/discovery layer;
9. webhook normalization into canonical delivery events, including Shiprocket `x-api-key` verification;
10. carrier ownership on cancel/track/label paths;
11. routing policy enforcement by pincode, parcel type, COD, reverse, SLA, cost ceiling and tenant preference;
12. observability: provider error rate, SLA variance, cost/order, delivery success and RTO;
13. Shopify merchant connector for order ingest + fulfilment updates;
14. Hostinger/n8n notification workflows that never become the shipment system of record;
15. Sequel/BVC adapters where commercially useful.

## Production gate

A provider becomes `live` only after credentials, sandbox/staging where available, controlled contract tests, webhook verification, idempotency, cancellation, tracking, label retrieval and one real controlled shipment are verified. Until then the UI must show `not configured`, `credentials detected` or `verification pending`, never simulated success.
