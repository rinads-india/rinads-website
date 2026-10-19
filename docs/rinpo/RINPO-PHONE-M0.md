# RINPO Phone M0 — Identity & Runtime Foundation

Status: **implementation foundation**

RINPO Phone is the personal, role-aware interface to the RINADS ecosystem. It is not a replacement mobile operating system, custom ROM, SIM product, or ungoverned autonomous agent.

## Product hierarchy

```text
RINADS
  -> RINADS Intelligence
  -> RINPO Runtime
  -> RINPO
  -> RINPO Phone
  -> RINADS WORLD / vertical OS surfaces
```

## M0 scope

This slice introduces pure, reusable contracts for:

- device/platform identity
- personal / organisation / client / world workspace context
- role, plan and permission-aware app visibility
- app capability boundaries
- governed runtime context validation
- action risk levels L0-L6
- universal `rinpo://` deep links with `https://phone.rinads.com` fallback

The package is intentionally database-agnostic. It does **not** add or apply production migrations. Persistent identity, workspace, device, app-installation, memory and continuity tables belong in a later migration slice after reconciliation with the current Company OS / security migration work.

## Invariants

1. Authentication does not imply authorization.
2. Authorization does not imply an app is allowed to invoke a capability.
3. Every runtime request carries actor, workspace, device, app and session context.
4. Organisation/client workspaces require a tenant id.
5. Personal workspaces cannot carry a tenant id.
6. World sessions cannot request unrestricted tenant memory.
7. App visibility is resolved from workspace type + platform + role + plan + required permissions.
8. High-risk actions use progressively stronger confirmation controls.
9. RINPO Phone clients never bypass existing RINADS tenancy, permissions, runtime approvals or audit contracts.
10. RINADS WORLD is another governed client, not a second business backend.

## Risk classes

| Level | Meaning | Default confirmation |
| --- | --- | --- |
| L0 | Read | none |
| L1 | Suggest | none |
| L2 | Draft | none |
| L3 | External action | confirm |
| L4 | Business commitment | confirm |
| L5 | Financial / destructive | biometric |
| L6 | Privileged administration | MFA |

Application policy may require stronger controls than these defaults, never weaker controls for a protected production action.

## Platform targets

The shared contracts recognize:

- web
- iOS / Android
- macOS / Windows
- watchOS / Wear OS
- tvOS / Android TV
- RINADS WORLD
- PlayStation (future WORLD client)

The UX is not required to be identical across devices. Shared identity, permissions, runtime, memory boundaries and deep links are the compatibility layer.

## Next slice: M1

M1 should wire these contracts into an authenticated RINPO Phone shell and add a server-side home resolver.

Recommended order:

1. reconcile persistent schema with current Company OS and RINPO security migrations
2. add RINPO ID / device / workspace persistence with RLS
3. implement server-side App Registry storage + resolver
4. expose `/api/v1/phone/home`
5. connect `Today`, `Ask RINPO`, `Work`, `Apps`, `World` and `Settings`
6. add privacy/memory controls and device revocation
7. add tests proving cross-tenant, cross-role and World-to-business isolation

## Explicitly deferred

- custom Android launcher
- default dialer replacement
- live PSTN/VoIP provider
- Apple Watch / Wear OS apps
- TV applications
- PlayStation release
- generic public mini-app marketplace
- physical RINPO handset

Those surfaces should reuse the same M0/M1 contracts after the core phone experience proves recurring usage.
