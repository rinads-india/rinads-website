# RINADS × Wix MVP

**Status:** Private Preview  
**Public route:** `/integrations/wix`  
**Readiness endpoint:** `/api/integrations/wix/status`  
**Verified webhook endpoint:** `/api/integrations/wix/webhook`

## Architecture

Wix is a channel, not the RINADS system of record.

```text
Wix business
  -> signed Wix webhook
  -> RINADS Wix Adapter
  -> internal RINADS event sink
  -> Business Graph
  -> RINADS Intelligence
  -> RINPO Runtime
```

RINADS core tenancy, policy, approvals, audit, and runtime boundaries remain outside Wix.

## Production truth

The RINADS-side discovery, activation gate, readiness endpoint, and signed-webhook adapter can ship independently of Wix credentials. The provider connection must remain labelled **Private Preview** until a RINADS-owned self-managed Wix app is created, all server-side credentials are configured, and the internal event sink is connected.

Do not mark this integration `live` merely because the public page or webhook route exists.

## Server-only configuration

Configure these in the deployment environment; never prefix them with `NEXT_PUBLIC_` and never commit their values:

```text
WIX_APP_ID=
WIX_APP_SECRET=
WIX_WEBHOOK_PUBLIC_KEY=
RINADS_WIX_EVENT_SINK_URL=
RINADS_WIX_EVENT_SINK_SECRET=
```

`WIX_APP_ID` becomes public only through the Wix installer URL after the complete activation path is present. `WIX_APP_SECRET`, `WIX_WEBHOOK_PUBLIC_KEY`, and the event-sink secret must never be returned by an API or rendered into browser JavaScript.

The public installer is intentionally disabled unless all five values are configured. This prevents installing RINADS on a Wix site before verified lifecycle events have somewhere durable to go.

## Verified webhook behavior

`POST /api/integrations/wix/webhook`:

1. reads the raw JWT body;
2. rejects missing configuration;
3. enforces a 1 MB payload ceiling;
4. accepts only `RS256`;
5. verifies the JWT signature with `WIX_WEBHOOK_PUBLIC_KEY`;
6. validates `exp`, `nbf`, and, when supplied by Wix, `iss` and `aud`;
7. extracts `eventType`, `instanceId`, event data, and identity;
8. creates a deterministic SHA-256 event ID from the signed token;
9. forwards only the verified normalized event to `RINADS_WIX_EVENT_SINK_URL` using the server-only integration secret;
10. returns HTTP 200 only after the internal sink accepts the event.

The endpoint does not log or echo the Wix payload. If the event sink is unavailable, it returns an error instead of acknowledging and silently dropping the event.

## Wix-side activation

1. Create a self-managed Wix app owned by RINADS.
2. Configure only the permissions required for the first pilot. Start narrow rather than requesting broad access.
3. Configure the five server-side environment values above.
4. Subscribe to App Instance Installed and App Instance Removed.
5. Set the webhook callback URL to `https://www.rinads.com/api/integrations/wix/webhook`.
6. Add only the business events required by the pilot, for example eCommerce, contacts, or bookings.
7. In the internal event sink, idempotently store the supplied `eventId` and map Wix `instanceId` to canonical RINADS `organization_id`.
8. Mint short-lived Wix app access tokens server-side using app ID, app secret, and instance ID. Never send the app secret to a client.

## MVP acceptance gates

- `/integrations` shows Wix as **Private preview**.
- `/integrations/wix` explains the channel/control-plane architecture and does not claim live sync.
- `/api/integrations/wix/status` exposes activation readiness without exposing secrets.
- `/api/integrations/wix/webhook` cryptographically verifies Wix webhook JWTs before forwarding any event.
- The Wix installer remains disabled until credentials and the internal event sink are configured.
- Regression tests keep Wix status at private preview and test signature, tamper, and audience rejection.
- No production database or tenant mapping is invented by this MVP.

## Next implementation slice

The next slice completes the internal data plane:

- idempotent provider event inbox;
- `instanceId` -> `organization_id` connection mapping;
- OAuth token minting and rotation server-side;
- canonical adapters for contacts, orders/catalog, and bookings;
- Business Graph event normalization;
- RINADS Intelligence Observe -> Understand -> Recommend -> Authorize -> Act -> Audit flow;
- RINPO actions only after normal RINADS policy and approval gates.

Until those paths are connected to a real RINADS tenant and validated against a Wix pilot site, the integration remains Private Preview.
