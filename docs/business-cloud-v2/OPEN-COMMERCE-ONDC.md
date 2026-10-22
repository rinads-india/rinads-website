# RINADS Open Commerce — ONDC foundation

Status: protocol foundation / not registered or live on ONDC.

RINADS integrates ONDC as an external commerce channel over the canonical Commerce, Billing, Finance and Shipping domains. It must not create a second order, payment or fulfilment authority.

## Version policy

At the 2026-10-21 implementation review, ONDC's official GitHub organization identifies B2C Retail `1.2.5` as the latest listed B2C retail contract. RINADS does **not** hard-code that version as permanent truth: every channel configuration stores its `protocol_version`, and wire payloads remain raw/versioned at the boundary.

The first RINADS contract recognizes the request/callback pairs:

- `search` / `on_search`
- `select` / `on_select`
- `init` / `on_init`
- `confirm` / `on_confirm`
- `status` / `on_status`
- `track` / `on_track`
- `cancel` / `on_cancel`
- `update` / `on_update`
- `rating` / `on_rating`
- `support` / `on_support`

This is an initial transaction contract, not a claim that every domain-specific ONDC flow, settlement, issue or reconciliation requirement is implemented.

## Canonical boundary

```text
RINADS catalogue / order / payment / fulfilment truth
                 ↓
        Open Commerce adapter
                 ↓
      ONDC versioned messages
                 ↓
       ONDC network participants
```

Network transaction IDs map back to an optional canonical RINADS `orders.id`. Network state is an integration projection; it does not replace local order authority.

## Delivered in this slice

- version-aware ONDC channel configuration contract
- buyer-app / seller-app role model
- action/callback pairing helpers
- stable message idempotency identity
- server-side signing/verification transport port contract
- durable `open_commerce_channels`
- durable network transaction → canonical order mapping
- append-only inbound/outbound protocol evidence
- same-organization channel/order/transaction constraints
- narrow channel-specific permissions/RLS
- production HTTPS requirement
- explicit external secret/key reference instead of storing private keys

## Security boundary

- private signing keys and registry credentials stay in an external secret store / server environment;
- protocol payload tables may contain customer/order data and are not readable through generic membership alone;
- browser clients cannot write network transactions or protocol messages;
- inbound callbacks must be verified by a server-side `OndcNetworkPort` before business mutation;
- ONDC callbacks must translate into existing Commerce/Runtime commands, audit and events rather than write arbitrary order state.

## Not implemented yet

- ONDC registry subscription/participant onboarding;
- signing-key generation/rotation;
- Authorization header signing and verification implementation;
- gateway/network transport;
- retail catalogue transformation;
- callbacks/routes;
- settlement/reconciliation;
- issue/grievance flows;
- network logistics orchestration;
- certification/log validation;
- production participant registration.

## Next build order

1. server-only signing + verification adapter and key rotation runbook;
2. staging participant/registry configuration;
3. catalogue projection from canonical products/variants/inventory;
4. `search → on_search` staging flow;
5. `select → init → confirm` mapping into canonical checkout/order commands;
6. status/cancel/update/track adapters;
7. RINADS Shipping / ONDC logistics handoff;
8. settlement/reconciliation evidence mapped into Billing + Finance Core;
9. issue/support flow;
10. ONDC validation tooling and controlled staging certification before any production claim.
