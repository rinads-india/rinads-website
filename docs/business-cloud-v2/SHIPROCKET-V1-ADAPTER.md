# Shiprocket v1 — fail-closed server client

Status: **implemented client primitives / external effects disabled by default**

RINADS uses Shiprocket as a provider beneath RINADS Shipping. Shiprocket is not the tenant boundary, Business Graph, authorization layer or routing authority.

## Verified provider contract

Authoritative Shiprocket API documentation (October 2026) defines:

- base URL: `https://apiv2.shiprocket.in/v1/external`
- authentication: API-user email + password at `POST /auth/login`
- returned token: JWT bearer token, documented as valid for 10 days
- serviceability/rates: `GET /courier/serviceability/`
- AWB assignment: `POST /courier/assign/awb`
- pickup request: `POST /courier/generate/pickup`
- label generation: `POST /courier/generate/label`
- AWB tracking: `GET /courier/track/awb/{awb_code}`
- shipment tracking: `GET /courier/track/shipment/{shipment_id}`
- shipment details: `GET /shipments/{shipment_id}`
- custom order creation: `POST /orders/create/adhoc`

Shiprocket also documents tracking webhooks and an MCP server. RINADS does not expose Shiprocket credentials to external AI clients; external agents must enter through RINADS authorization/runtime boundaries.

## Server secrets

Use the existing opaque logistics binding `shiprocket_primary`.

```text
RINADS_SHIPROCKET_EMAIL=
RINADS_SHIPROCKET_PASSWORD=
RINADS_SHIPROCKET_LIVE=0
```

Never use `NEXT_PUBLIC_` variables for provider credentials. Never store the API-user password or bearer token in tenant-supplied database fields.

## Read-only operations

Once credentials are configured, the server client can perform provider reads:

- courier serviceability/rates
- tracking by AWB
- tracking by shipment id
- shipment details

These operations still require the caller to satisfy RINADS tenant/auth authorization before they are exposed through an application route.

## External-effect operations

The following methods fail closed unless the client is created with `externalEffectsEnabled: true`:

- create custom order
- assign AWB
- request pickup
- generate label

That flag is only the provider-client gate. It is **not** sufficient authorization on its own. The caller must also pass the normal RINADS flow:

```text
Observe -> Context -> Policy -> Intent -> Plan -> Risk -> Approval -> Execute -> Verify -> Audit
```

## Token behavior

The client caches the bearer token in process memory and retries authentication once after an HTTP 401 when API-user credentials are available. It does not persist the JWT in browser storage, logs or tenant-facing database fields.

## PII/error handling

Provider error response bodies are deliberately omitted from thrown error messages because order/tracking responses can contain customer PII. Logs should use RINADS request/provider receipt identifiers rather than raw provider payloads.

## Production gate

Do not set `RINADS_SHIPROCKET_LIVE=1` and do not construct the client with `externalEffectsEnabled: true` until all of the following exist:

1. dedicated Shiprocket API user for RINADS;
2. server secrets configured in the intended environment;
3. read-only serviceability/tracking evidence captured;
4. test order created with non-sensitive test data;
5. AWB/pickup/label lifecycle verified;
6. webhook signature/security-token handling wired and tested;
7. normalized RINADS shipment/event mapping verified;
8. idempotency and retry policy verified;
9. tenant permission + RINPO Runtime approval path bound to mutations;
10. explicit founder production approval.

## Next adapter step

Bind this client to the canonical `CourierAdapter` only after shipment intent carries the address, items, package dimensions, payment mode and pickup-location fields required for deterministic Shiprocket order creation. Until then the client is a provider primitive, not a production routing adapter.
