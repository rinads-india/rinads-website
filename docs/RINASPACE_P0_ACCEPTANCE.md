# RINASPACE P0 Acceptance Contract

Date: 2026-10-22

## Purpose

P0 upgrades the existing `/space` route from a static role-filtered launcher into the canonical authenticated entry point for RINADS, without breaking current Business OS routes.

## Required P0 behaviors

1. User must be authenticated before entering RINASPACE.
2. The workspace must resolve organization membership and role from server-side data.
3. RINASPACE must present capabilities rather than duplicate backends.
4. Existing routes remain valid during migration.
5. The shell must visibly distinguish live, preview and planned capabilities.
6. RINPO/RINPO Phone is a persistent cross-capability interface, not a separate login silo.
7. The workspace must be prepared for entitlement filtering; hard-coded role filtering is temporary.
8. RINADS WORLD remains a separate spatial app and receives only governed, permission-checked business context.
9. Industry packs must appear as entitled capabilities rather than separate identity systems.
10. No production claim may be shown unless backed by a working route/integration.

## P0 information architecture

### Run
- Business OS
- Customers/CRM
- Work/Projects
- Finance
- Team
- Approvals

### Grow
- Campaigns
- Content
- Leads/Funnels
- Messaging
- Reviews/Retention

### Sell
- Commerce
- Orders
- Payments
- Shipping
- Storefront

### Create
- RINADS STUDIOS
- Assets
- Creative requests

### Build
- Software/automation requests
- Developer surfaces
- Integrations

### Learn
- Academy
- RINADS LABS
- Verified work/skills

### Experience
- RINPO Phone
- RINADS WORLD
- Digital Twin entry points

## Technical follow-up after P0

- Replace static app registry with a capability registry package.
- Add plan/entitlement resolution.
- Add organization switcher for users with multiple memberships.
- Add onboarding/provisioning state.
- Add recent work/approvals/notifications summary.
- Add shared RINPO shell.
- Add deep links into industry packs.

## P0 completion signal

A user signs in once, enters RINASPACE, sees only role/entitlement-appropriate capabilities, and can move into current Business OS or vertical experiences without re-authentication or losing tenant context.
