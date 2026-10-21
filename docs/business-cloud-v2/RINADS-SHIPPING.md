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
 tenant routing policy
               ↓
 selected CourierAdapter
               ↓
 Shipment → Tracking → Delivery / Return
```

## Delivered in this slice

- provider-neutral registry/router in `@rinads/operations`
- canonical provider keys for Delhivery, Porter, Shiprocket, Sequel, BVC, DTDC and local fleet
- provider enable/disable state
- operational capabilities: COD, reverse, same-day, scheduled, high-value
- quote/serviceability contract
- routing strategies: priority, lowest cost, fastest
- maximum-cost and maximum-ETA policy gates
- deterministic tie-breaking
- quote failures become unserviceable evidence rather than fake success
- no shipment is created until a serviceable provider satisfies policy
- tests for price/speed/capability routing, failure handling and creation

## Important boundary

The provider keys are **not** claims that those carrier APIs are integrated or enabled. The repository still needs real credentialed adapters for each carrier.

Do not use `DemoCourierAdapter` for production fulfilment.

## Next slices

1. persistent tenant carrier configuration with secrets held server-side;
2. Delhivery adapter + staging contract tests;
3. Porter adapter for local/on-demand delivery;
4. Shiprocket aggregator adapter where commercially useful;
5. Sequel/BVC high-value logistics adapters for Jewellery use cases;
6. webhook normalization into canonical delivery events;
7. carrier ownership on cancel/track/label paths;
8. routing policies by pincode, parcel type, COD, reverse, SLA, cost ceiling and tenant preference;
9. observability: provider error rate, SLA variance, cost/order, delivery success and RTO;
10. ONDC logistics/open-commerce channel integration as a separate adapter layer.

## Production gate

A provider becomes `live` only after credentials, sandbox/staging tests, webhook verification, idempotency, cancellation, tracking, label retrieval and one real controlled shipment are verified. Until then the UI must show `not configured` or `preview`, never simulated success.
