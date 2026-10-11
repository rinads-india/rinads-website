# RINADS WORLD — Thrissur Phase 1 (planning, not production)

Last verified: 2026-09-29. Owner: RINADS founder / nominated technical lead. Status: **planning and asset audit**.

## Decision
Build WORLD as an independently deployable, real-world-inspired multiplayer client. Reuse `rinads-website` as the canonical identity, tenant, commerce and approved RINPO action system. Do **not** turn `rinads-studio` (mock-only design library) into the game backend. Do not modify production routes, deployments, tenant schema or billing under this documentation PR.

Canonical Drive production register: https://docs.google.com/spreadsheets/d/1mHlodhejtjkHs75TZRgm0vAyqT_xKXpI4UvyF32i2YU/edit
Approved asset inbox: https://drive.google.com/drive/folders/1dKkDZU06m0iT8O85khIffniSLT5CQfSb
Field survey: https://drive.google.com/drive/folders/1DvOxsvQY9SXONv4uxZ8HhATSDPQJIi4Q
Merchant approvals: https://drive.google.com/drive/folders/1Lv1ObB9pcONqrBD268VGWGqHMkhzVzjA

## Verified asset baseline
- 207 original camera JPEG files, 32 MOV videos and 1 PNG in the existing RINPO shoot folder. **Original camera footage is not automatically cleared for commercial game use.**
- 407 files (391 PNGs and 16 JPEG copies) in "Thrissur round pics"; representative JPEGs are Google Street View captures. **Treat the complete directory as restricted pending individual source verification; do not copy, trace, train on, reconstruct from, texture from or bulk-import it into the game.**
- In the 20 GPS-reviewed original stills recorded in the Drive register, no image demonstrates coverage of the intended Swaraj Round pilot block. Other files have not been individually cleared or precisely geotagged. No true Round photogrammetry dataset has been established.
- The TCR TOWN / Round workspace now contains a reference register and separate capture, survey, approved-assets, merchant-rights and restricted-reference folders.

## First vertical slice
1. Independently field-survey a safely walkable **proposed** 250–400 m pilot corridor near the referenced commercial / Maidan-facing Round area. The specific start and end must come from the field survey; never promote coordinates copied from screenshots as verified.
2. Construct only a measured road/footpath, generic original buildings, public landscape edge and one **opt-in** merchant exterior. Prefer original fictional placeholder facades before consent arrives.
3. Spawn the **approved original** RINPO character master (do not generate a substitute), walk to an approved store and open RINPO Phone.
4. Read only a merchant-approved public storefront snapshot, then link to a verified canonical RINADS OS/commerce experience. A separate test-only purchase flow may be developed after checkout security review.
5. Provide two-player presence before vehicle driving; no mass-city claim and no unsupervised public multiplayer launch.

## Non-negotiable asset gate
Each asset needs a versioned manifest conforming to `asset-manifest.schema.json`. Default `usage_status` is `pending`. Game import must fail closed unless it is `approved`, the permitted uses include the target operation, and dated rights evidence is attached. Google Maps screenshots must never be approved for independent geometry, textures, training or repackaging based solely on upload ownership. OSM use demands a documented attribution/licence review (https://www.openstreetmap.org/copyright). An approved asset folder is not itself evidence of a right to use all its contents.

## Location & gameplay gate
Use independent geospatial surveying and legally sourced map data. A screenshot coordinate or a simulated road length is not field measurement. Label all game geography approximate until scale samples, waypoints and safe spawn/route accessibility are checked. Do not model identifiable passersby, reproduce licence plates or imply that merchants have signed up when they have not.

## Backend boundaries
- World client owns avatars, presentation, player session, movement, scene/asset state and virtual achievements.
- Canonical platform owns authentication, organisations, membership, permissions, store catalogue, lead capture, pricing, inventory, orders, payment records and fulfillment.
- Only purpose-scoped, short-lived session tokens issued by the canonical backend may authorize world read operations; no service-role keys or API secrets in Unity/WebGL.
- No direct world-client writes to commerce tables. Create real commercial events only via existing approved APIs with server-side permission checks, merchant organisation context, consent, idempotency and audit.
- World multiplayer chat, speech and user location need opt-in controls, moderation, reporting and data-retention design before public access. Founder's administrative access does not override tenant isolation.

## Engineering order & go/no-go
See `PLAYABLE-PILOT-ACCEPTANCE.md`. Check out the Drive **Build Gates** tab for evidence-based blockers G-01 through G-14. Do not expose a production public WORLD route until G-03 (survey), G-04 (original Round coverage), G-05 (copyright chain), G-06 (merchant), G-07 (licensed geographic base), G-09 (RINPO master) and G-13 (privacy) are green, with engineering and security signoff.

## Architectural rationale
The mock-only `rinads-studio` is a visual source, not a live runtime. The `rinads-website` monorepo already contains `packages/auth`, `tenancy`, `commerce`, `commerce-server`, `permissions`, `runtime` and `intelligence`; their actual production readiness and API contracts must be validated by code owners before use. Keep a Unity game client in a separate repository/project with source asset provenance, deterministic content builds and no monorepo deployment coupling. The original creator's permission and store contract must be recorded before asset ingestion.
