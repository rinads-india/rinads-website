# Wave 0 — RINASPACE Consolidation

Status: EXECUTION BASELINE
Date: 2026-10-22
Owner: RINADS Technologies
Canonical repository: `rinads-india/rinads-website`

## Decision

RINASPACE is the authenticated workspace layer of RINADS. It is not a new backend and it does not replace RINADS Intelligence, RINPO Runtime, RINPO, RINADS WORLD, RINADS STUDIOS, RINADS LABS, or industry packs.

The canonical product stack is:

1. RINADS — master platform
2. RINADS Cloud — identity, tenancy, data, APIs, storage and event foundation
3. RINADS Intelligence — governed reasoning/orchestration
4. RINPO Runtime — execution, workflows, tools, approvals and audit
5. RINPO — conversational/avatar interface
6. RINPO Phone — portable interaction shell
7. RINASPACE — authenticated role-aware workspace
8. Shared capabilities — Run, Grow, Sell, Create, Build, Learn
9. Industry packs — R GLOW, Jewellery, Automotive, Garden/Nursery, Field Service and future verticals
10. RINADS WORLD — spatial/digital-twin layer

## Canonical source rules

- New shared backend capability lands in `packages/*` in this repository.
- New authenticated RINADS workspace UX extends RINASPACE; do not create another Business OS shell.
- Industry-specific behavior must be implemented as configuration or an industry package unless there is a strong technical reason for a separate application.
- Client repos remain tenant/reference sources until reusable logic is extracted.
- Brand-specific IP must never be copied into generic packages without an explicit abstraction boundary.
- Google Drive remains a business/creative asset source, not the transactional system of record.
- External systems such as Calliyo, shipping providers, Meta, WhatsApp and payment gateways are adapters behind RINADS-owned contracts.

## Existing implementation to preserve

RINASPACE already exists at `/space` in `apps/website` and currently resolves authenticated user, organization membership and role before rendering a role-aware app launcher.

The owner portal already contains proven operational surfaces including operations, runtime, approvals, inventory, procurement, fulfilment, returns, orders, products, tasks, search and support. These become workspace capabilities rather than a separate product identity.

## Migration classes

### KEEP
Continue as a canonical app or package.

### MERGE
Extract reusable contracts, UI or workflows into this repository, then stop independent product development in the source project.

### TENANT
Keep customer-specific branding/data/experience while consuming canonical RINADS services.

### ARCHIVE
Preserve as historical reference; no new product work.

## Priority migration sources

### P0
- RINADS ONE — RINCALL/voice/event contracts and useful Business OS interaction patterns
- RINADS-RINPO — reusable RINPO assets/contracts
- AI-Native Business Communication OS — CRM/telephony/WhatsApp patterns
- Call Connect Hub — communication UI patterns
- RINADS Intelligence desktop Lovable prototype — RINASPACE shell/app-grid/RINPO Phone patterns
- Cozy Code Library / RINADS Studio / Intelligence migration sandbox — shared design primitives
- Active Innovative project management — generic Work/Projects/Field Operations domain

### P1
- R GLOW Salon Suite + Fab Signature + RINADS-SALON-ERP — R GLOW public and authenticated experience
- Ambady Pebbles Garden — commerce/store/admin UX and Garden/Nursery industry pack
- Bhima + Anupam/New Jewellery — generic Jewellery Pack while preserving Bhima-specific IP as tenant scope
- DriveFlow Pro + BRD ERP — Automotive Pack
- MyCEO — Finance/RINPO CFO concepts

### P2
- MA Living Studio — commerce/academy/community/service patterns
- Studios/Remotion experiments — creative workflow patterns
- Founder Command OS + Founder Control Tower — Founder Space

## Dependency order

1. Identity + tenancy + memberships
2. Roles + permissions + entitlements
3. RINASPACE shell and capability registry
4. RINPO shared interface
5. RINPO Runtime execution contracts
6. Communication adapters
7. Work Graph / tasks / approvals
8. Billing/payment + provisioning
9. Growth/commerce/creative/academy capabilities
10. Industry packs
11. RINADS WORLD/digital-twin adapters

## Non-negotiable governance

- Tenant isolation is enforced through RLS and service-layer authorization.
- AI or workflow execution is auditable.
- High-risk, expensive, external or irreversible actions require approval or explicit policy.
- Demo data and synthetic testimonials must never be represented as real production proof.
- Provider integrations are labelled live only after credentialed verification.
- Production secrets are never committed.

## Wave 0 exit criteria

Wave 0 is complete when:

- RINASPACE is the named authenticated workspace entry point.
- The app/capability registry is centralized rather than hard-coded across multiple shells.
- Canonical package ownership is documented.
- Duplicate platform repos have a migration destination and stop receiving overlapping product work.
- A preview build passes repository CI without changing production routing.
