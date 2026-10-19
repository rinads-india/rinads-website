# RINPO Phone M1 — Authenticated Web Shell

Status: **safe implementation slice / no production migration**

M1a turns the M0 contracts into a usable authenticated web shell while deliberately avoiding the unresolved Company OS/security persistence work.

## Included

- authenticated `/phone` shell
- server-side `/api/v1/phone/home` resolver
- role/workspace-aware app registry using the M0 resolver
- Today / Ask RINPO / Work / Apps / World / Settings navigation contract
- existing RINADS auth + tenancy membership resolution
- personal workspace fallback when no active organisation is selected
- no-store API responses
- explicit provisional identity/device status in Settings
- tests for personal-vs-organisation app visibility and route presence

## Security boundary

This slice does **not** create another auth, permissions, tenancy, memory or device system.

The web shell reuses:

- Supabase authentication
- `@rinads/tenancy` memberships and active-organisation cookie
- existing role and permission keys
- `@rinads/runtime` RINPO Phone context validation and App Registry rules

The shell is a client surface only. It does not grant authority to execute protected RINPO tools.

## Provisional identity limitation

Until the Company OS/security schema is reconciled, M1a uses:

- authenticated Supabase user id as the backing identity source
- an internal `auth:<user-id>` provisional RINPO identifier
- `web:unregistered` as the non-persistent device marker
- request/session UUIDs generated per server-side resolution

These values are sufficient for read-only home resolution but must **not** be treated as the final RINPO ID/device model.

## Deferred to M1b

Do not implement the following until the active Company OS/security migration work has completed staging/UAT reconciliation:

1. persistent RINPO ID table
2. registered-device table + revocation
3. workspace/app-installation persistence
4. privacy/memory preference persistence
5. cross-device continuity records
6. migrations that overlap `cos_*` or security/RLS changes

## M1b entry gates

- PR #135 security/Company OS migration shape reviewed and stable
- no production migration without founder approval
- tenant/RLS model reconciled with the existing organisation graph
- explicit cross-tenant, cross-role and WORLD-to-business isolation tests prepared before rollout

## Next safe engineering work

While persistence remains blocked, the shell can safely advance through:

- UI polish and responsive layout
- server-side read models
- RINPO Runtime read-only briefing adapter
- deep-link handling
- accessibility
- web install/PWA exploration
- observability for shell/API errors

Protected external actions, finance, deletion, permission changes and production administration remain governed by the existing L3–L6 confirmation policy and platform security gates.
