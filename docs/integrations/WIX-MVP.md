# RINADS × Wix MVP

**Status:** Private Preview  
**Public route:** `/integrations/wix`  
**Readiness endpoint:** `/api/integrations/wix/status`  
**Verified webhook endpoint:** `/api/integrations/wix/webhook`  
**Verified tenant-binding page:** `/integrations/wix/connect`  
**Internal event sink:** Supabase Edge Function `wix-event-sink`

## Architecture

Wix is a channel, not the RINADS system of record.

```text
Wix business
  -> signed Wix webhook
  -> RINADS Wix Adapter
  -> authenticated internal event sink
  -> provider_event_inbox
  -> integration_connections (instanceId -> organization_id)
  -> canonical business_events
  -> Business Graph
  -> RINADS Intelligence
  -> RINPO Runtime
```

RINADS core tenancy, policy, approvals, audit, and runtime boundaries remain outside Wix.

## Production truth

The public connector, webhook verification, durable data-plane schema, event normalizer, OAuth token helper, and tenant-binding confirmation flow exist in source. The integration must remain **Private Preview** until the canonical RINADS platform database has the connector migration applied, the `wix-event-sink` Edge Function is deployed, the real RINADS-owned Wix app credentials are configured, and a real Wix tenant passes install -> bind -> business-event verification end to end.

Do not mark the integration `live` merely because the public page, Vercel deployment, or webhook route exists.

## Server-only configuration

Configure these in the website deployment environment; never prefix them with `NEXT_PUBLIC_` and never commit their values:

```text
WIX_APP_ID=
WIX_APP_SECRET=
WIX_WEBHOOK_PUBLIC_KEY=
RINADS_WIX_EVENT_SINK_URL=
RINADS_WIX_EVENT_SINK_SECRET=
```

Configure the same `RINADS_WIX_EVENT_SINK_SECRET` in the Supabase Edge Function environment. The Edge Function uses the normal Supabase-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` values internally.

`WIX_APP_ID` becomes public only through the installer URL after the complete activation path is present. `WIX_APP_SECRET`, `WIX_WEBHOOK_PUBLIC_KEY`, the Supabase service-role key, and the event-sink secret must never be returned by an API or rendered into browser JavaScript.

## Persistent data plane

Migration: `supabase/migrations/20261022153000_wix_connector_core.sql`

### `integration_connections`

Owns provider installation identity. For Wix, `external_instance_id` is the Wix `instanceId`. A provider instance can map to only one canonical RINADS organization. Cross-tenant rebinding is rejected.

No Wix access token or app secret belongs in this table.

### `provider_event_inbox`

Owns at-least-once delivery safety and provider-event provenance.

- unique `(provider, event_id)` prevents duplicate processing;
- unbound Wix instances are stored as `quarantined` rather than guessed into a tenant;
- raw provider payloads are readable only by authenticated users with `org.manage` after a tenant is bound;
- events received before binding are replayed into `business_events` after a verified tenant binding.

### Canonical event bus

The connector reuses existing `public.business_events`; it does not create a Wix-specific downstream event bus.

Initial mappings:

| Wix event | Canonical RINADS event |
|---|---|
| `AppInstalled` | `integration.connected.v1` after tenant binding |
| `AppRemoved` | `integration.disconnected.v1` |
| `wix.ecom.v1.order_created` | `order.created.v1` |
| `wix.contacts.v4.contact_created` | `contact.created.v1` |
| `wix.bookings.v2.booking_created` | `booking.created.v1` |
| Other verified Wix events | `integration.event_received.v1` |

Every emitted provider event uses `wix:<provider-event-id>` as the canonical idempotency key.

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
9. forwards only the verified normalized event to `RINADS_WIX_EVENT_SINK_URL` with the server-only integration secret;
10. returns HTTP 200 only after the internal sink accepts the delivery.

The public webhook does not log or echo the Wix payload. If the internal sink is unavailable, the webhook fails instead of acknowledging and silently dropping the event.

## Internal event sink behavior

Deploy `supabase/functions/wix-event-sink/index.ts` with public JWT verification disabled at the Supabase gateway because the function performs its own server-to-server shared-secret authentication.

The function:

1. accepts only POST;
2. verifies `X-RINADS-Integration-Secret`;
3. verifies `X-RINADS-Provider: wix` and the supplied event ID;
4. creates or updates the Wix provider connection;
5. inserts the provider event idempotently;
6. returns `202 quarantined` if `instanceId` is not yet bound to a RINADS tenant;
7. emits a versioned canonical `business_events` row only for a bound tenant;
8. tolerates duplicate deliveries without duplicating business effects.

## Secure tenant binding

Wix `instanceId` must never be accepted from browser plaintext as proof of site identity.

`/integrations/wix/connect` accepts Wix `signedInstance` / `instance` data, verifies its HMAC-SHA256 signature using `WIX_APP_SECRET`, resolves the logged-in active RINADS organization, and presents an explicit confirmation step.

`POST /api/integrations/wix/bind` then:

- requires a same-origin form POST;
- verifies the Wix signed instance again;
- requires authenticated RINADS tenancy;
- requires `org.manage`;
- invokes `bind_integration_connection('wix', instanceId, organization_id)`;
- rejects cross-tenant rebinding;
- writes the canonical connection event and audit log;
- replays quarantined pre-binding business events idempotently.

For the Wix app activation, configure an external dashboard/install callback to `https://www.rinads.com/integrations/wix/connect` so Wix supplies signed app-instance data. Keep the explicit confirmation step; do not turn the callback GET into a state-changing tenant bind.

## Wix API authentication

`apps/website/lib/integrations/wix-oauth.ts` implements Wix's OAuth `client_credentials` flow for self-managed apps:

```text
POST https://www.wixapis.com/oauth2/token

grant_type=client_credentials
client_id=<WIX_APP_ID>
client_secret=<WIX_APP_SECRET>
instance_id=<verified Wix instanceId>
```

App tokens are short-lived and are minted server-side on demand. Do not expose or persist `WIX_APP_SECRET` in tenant data.

## Wix-side activation

1. Create and release a self-managed Wix app owned by RINADS.
2. Start with only the scopes required for the pilot: Manage Your App plus the minimum Read Orders / Read Contacts / Bookings scopes used by the selected events.
3. Configure the five website environment values above.
4. Apply `20261022153000_wix_connector_core.sql` to the canonical RINADS platform Supabase project.
5. Deploy `wix-event-sink` to that same project and configure `RINADS_WIX_EVENT_SINK_SECRET` there.
6. Subscribe to App Instance Installed and App Instance Removed.
7. Subscribe to the required pilot business events, initially Order Created, Contact Created, and Booking Created where relevant.
8. Set the Wix webhook callback URL to `https://www.rinads.com/api/integrations/wix/webhook`.
9. Configure the Wix external dashboard/post-install destination to `https://www.rinads.com/integrations/wix/connect` so RINADS receives signed app-instance context for tenant binding.
10. Install the app on one controlled pilot Wix site, bind it to a non-production or pilot RINADS tenant, and verify one event of each enabled class.

## Release gates

The integration can move from Private Preview only when all are true:

- website production deployment is green;
- canonical Supabase migration is applied;
- `wix-event-sink` is deployed and responds only to the shared secret;
- real Wix app ID, app secret, and webhook public key are configured server-side;
- AppInstalled creates or resolves the expected `integration_connections` row;
- signed-instance confirmation binds the correct active RINADS organization;
- a duplicate Wix webhook produces one inbox row and one business effect;
- an unbound instance is quarantined, never auto-assigned;
- Order Created maps to `order.created.v1` for the bound tenant;
- Contact Created maps to `contact.created.v1` for the bound tenant;
- Booking Created maps to `booking.created.v1` for the bound tenant when Bookings is enabled;
- AppRemoved marks the connection removed and emits `integration.disconnected.v1`;
- no Wix secret, service-role key, raw token, or cross-tenant provider payload is exposed to the browser.

Until these gates are satisfied against a real Wix pilot site, the integration remains Private Preview.
