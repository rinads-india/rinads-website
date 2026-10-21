# RINADS WORLD Integration Guide

> Status: PREVIEW
> Unity runtime: `world.rinads.com` (separate repo: rinads-india/RinadsWorld)

## Architecture

```
www.rinads.com/world  ←→  world.rinads.com (Unity WebGL)
     Next.js                   Unity runtime
     (gateway)                 (full experience)
```

The gateway page at `/world` is a Next.js server component that:
1. Fetches the WORLD manifest from `world.rinads.com/MANIFEST.json` (2s timeout, 10KB guard)
2. Shows WORLD status, destinations, and CTAs
3. Redirects to `https://world.rinads.com` on "Enter" click

**WORLD is never proxied through Next.js.** The Unity runtime runs entirely at `world.rinads.com`.

## RI World Bridge v1

Package: `packages/world-contract/`

Typed TypeScript contract for postMessage communication between the platform and WORLD.

### Platform → WORLD messages

| Type | Description |
|------|-------------|
| `ri:bootstrap` | Send actor + workspace data on Unity load |
| `ri:identity:update` | Auth state changed (login/logout) |
| `ri:world:deep-link` | Navigate to a named place |
| `ri:entity:open` | Open an entity panel |
| `ri:rinpo:open` | Open RINPO chat overlay |
| `ri:marketplace:open` | Open marketplace panel |
| `ri:transaction:continue` | Resume a payment flow |
| `ri:theme:update` | Dark/light mode change |

### WORLD → Platform events

| Type | Description |
|------|-------------|
| `world:ready` | Unity loaded, waiting for bootstrap |
| `world:place:entered` | User moved to a named place |
| `world:entity:selected` | User tapped an entity |
| `world:transaction:intent` | User initiated a purchase |
| `world:error` | Runtime error |

### Legacy compatibility

The contract also includes legacy message types (`SetHubMode`, `EnterDashboardRoom`, `ready`, `hub`, `play`, `room-entered`, `fps`, `error`) for backward compatibility with older Unity builds.

## Bootstrap API

`GET /api/v1/world/bootstrap`

Returns a `WorldBootstrapPayload` with actor identity, workspace, feature flags, and RINPO endpoints.

- Authenticated: `private, no-store` cache, full actor profile
- Guest: `public, max-age=60` cache, anonymous bootstrap
- MANIFEST fetch failure: returns a valid guest bootstrap gracefully (never 500s)

## Security rules

- No auth tokens in URLs or Unity PlayerPrefs as security authority
- No service-role key in client code or WORLD
- WORLD cannot query the database directly — all data flows through `/api/v1/world/bootstrap`
- `worldReturnUrl` is always `https://www.rinads.com/world` — no open redirect
- RLS remains enforced on all Supabase tables regardless of WORLD requests

## Adding a new WORLD destination

1. Add the destination to `WorldManifest.places` in `packages/world-contract/src/index.ts`
2. Update `WorldGatewayClient.tsx` destinations array
3. Update `world.rinads.com/MANIFEST.json` in the RinadsWorld repo
4. Set `availability` to `"available"` only after the Unity scene is shipped
