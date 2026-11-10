# Social OS — Current State

_Discovery date: 2026-11-10_

## Repository layout

| Path | Purpose |
|------|---------|
| `apps/website/app/os/growth/page.tsx` | Growth module bridge (OsModuleBridge). Currently lists three unavailable destinations. |
| `apps/website/app/os/approvals/page.tsx` | Approvals inbox — demonstrates CompanyOsPanel + RINPO Runtime approval integration |
| `packages/runtime/src/approval/` | Approval workflow types and helpers used by Company OS |
| `packages/database/src/` | Supabase typed client (browser + server + service-role) |
| `packages/tenancy/src/types.ts` | `TenancyContext` and `OrgMembership` — multi-tenant identity layer |
| `packages/permissions/src/types.ts` | `RoleKey`, `PermissionKey`, `AccessDecision` — RBAC core |
| `supabase/migrations/` | 20+ migrations; latest is `20261016120000_company_os_foundation.sql` |

## Growth module (target parent)

`/os/growth` currently renders an `OsModuleBridge` with three destinations:
- `marketing-os` → external public page (available)
- `campaigns` → unavailable stub
- `seo` → unavailable stub

There is **no** `/os/growth/connections` route at all — it must be created.

## What exists for social/integrations

- **No** `social_connections` or OAuth table in any migration
- **No** existing provider adapter for Facebook, Instagram, or any social network
- **No** token vault or credential encryption library
- `/os/platforms` renders a `CompanyOsWorkspaceStub` (placeholder)
- `/os/automate` → `OsModuleBridge` pointing at owner portal and other stubs
- Developer docs at `/developers/authentication` describe public RINADS API auth — not provider OAuth

## Tenancy + auth infrastructure (available, do not duplicate)

- `createWebsiteServerClient()` — cookie-based Supabase client for server components
- `createServiceRoleClient()` — service-role for server-only DB mutations
- `requireOsShellAccess()` — full membership + org-role gate for every `/os/*` route
- `TenancyContext.organizationId` — tenant discriminator for every RLS policy
- `RoleKey` enum (`founder | super_admin | admin | manager | staff | client | viewer`)
- `OsCapabilityTier` (`admin | staff | client`) — derived from `RoleKey` via `capabilityTierFromRoleKey`

## Gaps that this feature fills

1. **OAuth connection lifecycle** — no PKCE session table, no callback handler, no token storage
2. **Provider adapters** — no Facebook/Instagram Graph API client
3. **Social publishing pipeline** — no post queue, approval gate, or publish job table
4. **Connections dashboard** — no UI surface under Growth
5. **Audit log integration** — existing `audit_logs` table is the target; social actions need entries
6. **RINPO Runtime hooks** — approval workflow exists but is not wired to social publishing

## Design system tokens in use

- `os-glass` — glassmorphism panel (rgba white + backdrop-filter)
- `os-glass-dark` — dark variant
- `CompanyOsPanel` — titled rounded-3xl panel
- `OsCapabilityTier`-gated `CompanyOsDemoNotice` — staging banner pattern
- Tailwind classes via `cn()` util
- Lucide icons throughout OS shell
