# RINADS × Wix MVP

**Status:** Private Preview  
**Public route:** `/integrations/wix`  
**Readiness endpoint:** `/api/integrations/wix/status`

## Architecture

Wix is a channel, not the RINADS system of record.

```text
Wix business
  -> RINADS Wix Adapter
  -> Business Graph
  -> RINADS Intelligence
  -> RINPO Runtime
```

RINADS core tenancy, policy, approvals, audit, and runtime boundaries remain outside Wix.

## Production truth

The RINADS-side discovery and activation surface can ship independently of Wix credentials. The provider connection must remain labelled **Private Preview** until a RINADS-owned self-managed Wix app is created and the required server-side credentials are configured.

Do not mark this integration `live` merely because the public page exists.

## Server-only configuration

Configure these in the deployment environment; never prefix them with `NEXT_PUBLIC_` and never commit their values:

```text
WIX_APP_ID=
WIX_APP_SECRET=
WIX_WEBHOOK_PUBLIC_KEY=
```

`WIX_APP_ID` becomes public only through the Wix installer URL after all required connector credentials are present. `WIX_APP_SECRET` and `WIX_WEBHOOK_PUBLIC_KEY` must never be returned by an API or rendered into browser JavaScript.

## Wix-side activation

1. Create a self-managed Wix app owned by RINADS.
2. Configure only the permissions required for the first pilot. Start narrow rather than requesting broad access.
3. Subscribe to the App Instance Installed and App Instance Removed lifecycle events.
4. Add the business events required by the pilot, for example eCommerce, contacts, or bookings.
5. Configure the callback URL only after a verified webhook ingestion route is deployed.
6. Store each Wix `instanceId` against the canonical RINADS `organization_id` before calling site-scoped Wix APIs.
7. Mint short-lived Wix app access tokens server-side using the app ID, app secret, and instance ID. Never send the app secret to a client.

## MVP acceptance gates

- `/integrations` shows Wix as **Private preview**.
- `/integrations/wix` explains the channel/control-plane architecture and does not claim live sync.
- `/api/integrations/wix/status` exposes readiness without exposing secrets.
- The Wix installer link remains disabled until the three server-side credential values exist.
- Regression tests keep Wix status at private preview until a real production connection is explicitly promoted.
- No database migration or tenant mapping is implied by this surface-only MVP.

## Next implementation slice

The next slice is the secure data plane:

- verified signed-Wix-JWT webhook ingestion;
- idempotent provider event inbox;
- `instanceId` -> `organization_id` connection mapping;
- OAuth token minting and rotation server-side;
- canonical adapters for contacts, orders/catalog, and bookings;
- Business Graph event normalization;
- RINADS Intelligence Observe -> Understand -> Recommend -> Authorize -> Act -> Audit flow;
- RINPO actions only after normal RINADS policy and approval gates.

Until that slice is deployed and configured, the Wix integration must remain Private Preview.
