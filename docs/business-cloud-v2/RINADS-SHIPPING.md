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

## RINADS Intelligence / RINPO Runtime boundary

RINADS Intelligence is the control plane. It may rank serviceable provider candidates using governed operational evidence, but it does not bypass authorization policy.

RINPO Runtime is the execution plane. It should call the selected provider adapter, monitor lifecycle events, trigger approved exception workflows and write audit evidence only after RI/policy authorization.

Do not let a conversational RINPO surface directly choose or call a carrier outside this boundary.

## Persistence boundary

`logistics_provider_configs` stores tenant enablement, priority, capabilities, non-secret configuration and an opaque credential binding key. It must never store a DTDC/Delhivery/Porter token, password or private key.

`logistics_routing_policies` stores tenant strategy, ceilings, intelligence weights and autonomy/approval thresholds.

`logistics_decision_events` is append-only for authenticated actors. It captures the policy/evidence snapshot that explains why RI recommended, authorized or executed a logistics action.

Provider secret values remain in server-side environment/vault/connector infrastructure and are resolved only by the provider adapter at execution time.

## Important boundary

The provider keys are **not** claims that those carrier APIs are integrated or enabled. The repository still needs real credentialed adapters for each carrier.

Do not use `DemoCourierAdapter` for production fulfilment.

Current carrier credential contract names are intentionally server-only setup metadata:

- `RINADS_DTDC_API_TOKEN`
- `RINADS_DELHIVERY_API_TOKEN`
- `RINADS_PORTER_API_KEY` + `RINADS_PORTER_API_SECRET`
- `RINADS_ONDC_SUBSCRIBER_ID` + `RINADS_ONDC_SIGNING_PRIVATE_KEY`

Additional provider contracts are defined in `apps/website/lib/logistics-os.ts`. Secret values must never be prefixed with `NEXT_PUBLIC_`.

A `*_LIVE=1` flag must never be set merely because credentials exist. Live status requires the production gate below.

## Next slices

1. repository/service adapter that loads tenant provider config + routing policy into `CourierProviderRouter`;
2. DTDC adapter against the existing Mannuthy API account + sandbox/controlled contract tests;
3. Delhivery adapter + staging contract tests;
4. Porter Enterprise adapter for local/on-demand delivery;
5. ONDC Delivery protocol adapter/discovery layer;
6. webhook normalization into canonical delivery events;
7. carrier ownership on cancel/track/label paths;
8. routing policy enforcement by pincode, parcel type, COD, reverse, SLA, cost ceiling and tenant preference;
9. observability: provider error rate, SLA variance, cost/order, delivery success and RTO;
10. Shopify merchant connector for order ingest + fulfilment updates;
11. Hostinger/n8n notification workflows that never become the shipment system of record;
12. Shiprocket/Sequel/BVC adapters where commercially useful.

## Production gate

A provider becomes `live` only after credentials, sandbox/staging tests, webhook verification, idempotency, cancellation, tracking, label retrieval and one real controlled shipment are verified. Until then the UI must show `not configured`, `credentials detected` or `verification pending`, never simulated success.
