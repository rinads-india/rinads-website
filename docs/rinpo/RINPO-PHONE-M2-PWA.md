# RINPO Phone M2 — Installable Web App Alpha

Status: stacked on M1. This is a Progressive Web App delivery surface, not a native mobile/desktop operating system.

## Objective

Make the existing RINPO Phone experience directly launchable at `/phone` and installable through supported browser / Add to Home Screen flows before investing in separate iOS, Android, macOS and Windows binaries.

## Delivered

- standalone `/phone` route
- page-scoped web app manifest at `/phone/manifest.webmanifest`
- `standalone` display mode with RINADS dark theme
- manifest shortcuts for Today, Ask RINPO and RINADS WORLD
- service-worker lifecycle registration scoped to `/phone`
- network-only service worker; authenticated/API responses are never cached
- standalone launch screen that opens the governed RINPO Phone shell
- existing Supabase authentication, workspace resolver, permissions and RLS remain authoritative
- no database migration

## Security and product-truth rules

1. Do not describe this as a replacement for iOS, Android, macOS or Windows.
2. Do not claim native phone/dialer, background calling, push notifications, offline business data or cross-device memory from this slice.
3. The service worker MUST NOT cache `/api/*` or authenticated business pages without an explicit data-classification review.
4. PWA installability is progressive enhancement. Browser support may vary.
5. All sensitive actions continue through existing RINADS server/runtime/approval paths.
6. `/phone` is `noindex` during alpha so the public marketing route `/rinpo/phone` remains the canonical product-description surface.

## Why PWA first

A single web delivery surface provides the fastest path to real user validation across:

- iPhone / iPad — Add to Home Screen
- Android — browser install / Add to Home Screen
- macOS — supported browser web-app installation
- Windows — supported browser PWA installation

This validates daily usage, information architecture and workspace switching before committing to native distribution costs.

## Native boundary

The future native clients should consume the same authenticated phone APIs and RINPO Runtime contracts. Native clients are justified when we need capabilities the PWA cannot reliably provide, such as deeper OS integrations, push/background execution, platform-specific widgets, Watch/Wear companions, advanced audio/calling, secure device binding or store distribution.

## Next gate

M3 should not start with more UI. Reconcile persistent RINPO identity/device/session/memory tables with the active Company OS migration chain, then add device registration/revocation and scoped memory provenance behind RLS.
