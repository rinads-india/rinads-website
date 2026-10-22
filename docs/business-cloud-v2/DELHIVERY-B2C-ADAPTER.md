# Delhivery B2C — staging-first server client

Status: implemented client primitives / not a live RINADS `CourierAdapter`.

## Why this is server-only first

Delhivery shipment manifestation requires carrier-specific consignee, pickup-location, payment, GST/product and order data. The current canonical `CourierAdapter.createShipment` input intentionally does not expose those carrier-specific fields.

Do not leak Delhivery payload objects into the frontend or broaden the canonical domain merely to mirror one carrier. The next adapter layer must resolve canonical Order → Fulfilment → Package → Address/Product/Tax data server-side, then translate it into this client.

## Authentication

Delhivery B2C uses a static account token in the request header:

```text
Authorization: Token <API_TOKEN>
```

RINADS resolves that token only through the server-owned opaque credential binding:

```text
delhivery_primary -> RINADS_DELHIVERY_API_TOKEN
```

A database `credential_key` never becomes an environment-variable lookup.

## Environment boundary

Staging base:

```text
https://staging-express.delhivery.com
```

Production base:

```text
https://track.delhivery.com
```

`DelhiveryB2cClient` defaults to staging. Production construction requires both:

- `environment: "production"`
- `productionEnabled: true`

This second code-level gate is separate from Logistics OS tenant verification and the final `RINADS_DELHIVERY_LIVE` production gate.

## Implemented primitives

| Capability | Method | Endpoint |
| --- | --- | --- |
| PIN serviceability | GET | `/c/api/pin-codes/json/?filter_codes=...` |
| Shipping cost | GET | `/api/kinko/v1/invoice/charges/.json` |
| Tracking | GET | `/api/v1/packages/json/` |
| Packing slip / label source | GET | `/api/p/packing_slip` |
| Cancel | POST | `/api/p/edit` |
| Pickup request | POST | `/fm/request/new/` |
| Manifest | POST | `/api/cmu/create.json` |

Manifestation uses the carrier-required form encoding:

```text
format=json&data=<JSON>
```

## Safety rules in code

- 6-digit PIN validation before requests
- positive chargeable weight
- staging by default
- explicit production gate
- no carrier response body is included in HTTP error messages because responses can contain customer PII
- no automatic retries for state-changing carrier calls
- malformed carrier JSON fails explicitly
- no token logging
- no browser export of secrets

## Delhivery operational rules to preserve

- serviceability must be checked before manifestation
- staging and production use different tokens
- pickup location/warehouse name is account-specific and case-sensitive
- pickup request is generally required for forward shipments unless account operations configure scheduled pickup
- order identifiers must satisfy Delhivery uniqueness rules
- wallet/account service configuration can block manifestation
- high-value shipments may require e-waybill/GST fields based on applicable rules and carrier requirements

## Not yet production-ready

Do not mark `adapterImplemented=true` or `RINADS_DELHIVERY_LIVE=1` yet.

Remaining gate:

1. canonical server translator from RINADS Order/Fulfilment/Package/Address/Product/Tax data;
2. tenant warehouse/pickup-location mapping;
3. explicit idempotency command/outbox around manifestation, cancel and pickup;
4. normalized tracking/webhook event mapper;
5. authoritative post-timeout recovery lookup;
6. sandbox contract test using the tenant's actual Delhivery staging account/token;
7. label verification;
8. pickup verification;
9. cancellation verification;
10. webhook verification/dedupe;
11. one controlled real shipment;
12. only then set controlled verification and live gates.

## Source references

Current Delhivery Developer Portal / API documentation:

- https://one.delhivery.com/developer-portal/documents/b2c/
- https://one.delhivery.com/developer-portal/document/b2c/detail/faq
- https://one.delhivery.com/developer-portal/document/b2c/detail/order-tracking
- https://delhivery-express-api-doc.readme.io/reference/1-pincode-servicability-api
- https://delhivery-express-api-doc.readme.io/reference/order-creation-api
- https://delhivery-express-api-doc.readme.io/reference/cancel-order-api
- https://delhivery-express-api-doc.readme.io/reference/pickup-request-creation-api
- https://delhivery-express-api-doc.readme.io/reference/packing-slip-api
