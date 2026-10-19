# RINPO Phone M1 — Intelligent Shell

Status: stacked implementation on top of M0. Not a production mobile OS and not a telephony-provider claim.

## Scope delivered in this slice

- compact handset dock: Today / RINPO / Work (when available) / World / Apps
- authenticated `GET /api/v1/phone/home`
- active workspace resolution from the existing tenancy membership + active-organisation cookie model
- authenticated `POST /api/v1/phone/workspaces/select`
- Personal ↔ organisation workspace switching without changing login identity
- server-derived app visibility for the active organisation
- explicit `visibilityOnly: true` contract: navigation visibility is never treated as authorization
- authenticated Apps home fails closed when the server resolver cannot load
- RINADS WORLD screen with an explicit trust boundary
- Settings/Privacy surface for the currently implemented browser-scoped memory preferences
- English / Malayalam and voice preference controls
- M1 contract tests

## Security invariants

1. A workspace switch to an organisation is accepted only when the signed-in user has an active membership in that organisation.
2. Selecting Personal clears the active organisation cookie for the current signed-in identity.
3. UI app visibility does not grant access. All protected data/actions must still pass server authorization and Supabase RLS.
4. WORLD does not directly read private tenant business memory.
5. Authenticated Phone home uses `private, no-store` responses.
6. When the authenticated home resolver fails, the handset does not fall back to fabricated business data.
7. Cross-device memory, device revocation and session continuity are not claimed as live in this slice.

## M1 app visibility

Base surfaces:

- Today
- RINPO
- World
- Apps

Organisation surfaces are added from trusted membership role/permission context. This resolver is a presentation adapter only; it does not replace the existing permissions package, runtime approval gates or RLS.

## Still pending before native beta

- persistent RINPO ID/device/session tables after reconciliation with active Company OS migrations
- device registration and revocation
- push notification service
- server-backed scoped memory/provenance controls
- native iOS/Android shell
- durable cross-device continuity
- WORLD presence/session bridge
- production telephony provider integration
- App Store / Play Store packaging and policy review

## Release rule

Keep this stacked PR in draft until CI (lint, typecheck, tests, build and public Playwright smoke) is green. Do not apply new database migrations from this slice.
