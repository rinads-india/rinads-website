# WORLD-001 — Playable Thrissur Pilot: executable acceptance criteria

The **Drive master register** is the field-production source of truth:
https://docs.google.com/spreadsheets/d/1mHlodhejtjkHs75TZRgm0vAyqT_xKXpI4UvyF32i2YU/edit

All scope below is unshipped until supported by a reviewed PR, an executed test and evidence linked to the register.

## Work packages

| ID | Workstream | Acceptance evidence | Gate |
| --- | --- | --- | --- |
| W-01 | Field survey | Independent GPX of the pilot corridor, measured crossing/footpath widths and survey date; field lead confirms exact entrance/exit waypoints | G-03 |
| W-02 | Original environment capture | P0 shots completed in Drive's `Field Shot List`; time/angle annotations and mapped field assets; gap checklist closed | G-04 |
| W-03 | Provenance | Original creator agreement, approved commercial derivative/game rights and per-asset manifest; privacy check on identifiable people | G-05, G-13 |
| W-04 | Merchant partner | Signed first merchant agreement allowing accurate virtual representation, approved brand marks/interior/catalogue and withdrawal/update process | G-06 |
| W-05 | Independent geography | Permitted OSM-derived source where useful, required attribution and ODbL review; own survey measurements; no Google extraction | G-07 |
| W-06 | Unity visual slice | Version-pinned Unity project, placeholder scene, deterministic import validation, walking RINPO avatar after approved master, tested on declared device | G-08, G-09 |
| W-07 | World gateway | Short-lived authenticated read-only discovery endpoint with explicit public/private field allowlist; negative cross-tenant test | Backend security |
| W-08 | Real commerce handoff | Merchant-approved data render and HTTPS handoff to canonical storefront; test-environment transaction verified **only after** platform owner reviews idempotency and RBAC | G-11 |
| W-09 | Multiplayer | Private two-player presence behind invitation; server authoritative; report/block interaction; test targets later based on measured hardware/server capacity | G-12 |
| W-10 | Founder acceptance | Full demo video, licence manifest, costs & performance report; 0 unresolved critical privacy/checkout defects | G-14 |

## Sequencing
- **P0 / before Unity modelling:** W-01, W-02, W-03, W-04, W-05. A gray-box private prototype may proceed using *original generic placeholder assets* while they are pending, but it may not be called an accurate Round reconstruction.
- **P1 / client slice:** W-06 plus W-07. Build a single interactive approved storefront and read-only RINPO Phone deep-link; no game-side autonomous purchase actions.
- **P2 / after security and rights review:** W-08, private W-09, then W-10. Only pilot evidence justifies adding more Round sectors.

## Explicitly excluded from Phase 1
Full Thrissur/India/global replicas; Google Street View image-to-mesh extraction; true-to-life renderings of non-participating shops; monetized missions; real-money in-world economy; live voice for minors; scalable driving traffic; open public multiplayer; production founder override across tenants.

## Minimum metrics
- 100% of the *selected* original assets have attached rights evidence and an approved manifest.
- 100% of scene distances/waypoints advertised as real-world accurate are independently surveyed.
- 100% of private merchant access attempts without an authenticated organization grant are denied in automated negative tests.
- Single merchant storefront data reconciles against the canonical platform without a duplicate stock or order copy owned by World.
- Performance baseline documented on both a development computer and a chosen low-end target device before expanding scope.

## Implementation constraints
Feature-flag any future `/world` discovery entry; keep it private until acceptance. Do not add Unity build artifacts, Google maps screenshots or uncensored raw field captures to the public website repo. Store raw assets in access-controlled Drive/object storage with an immutable manifest and explicit lifecycle. Studio templates can be adopted by API/version, not treated as independent account or commerce systems.
