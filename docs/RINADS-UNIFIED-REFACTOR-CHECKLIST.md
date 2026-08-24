# RINADS Unified Refactor Checklist

Source: 50-file audit + v5.1 canonicalization. Track progress here.

## P0 — Architecture locks

- [x] RINADS Business OS is the core product name (not a separate agency brand)
- [x] RINADS Services replaces Watermelon delivery brand in product UX
- [x] RINPO is intelligence layer — not the service assignment engine
- [x] No n8n runtime dependency (n8n JSON is reference only)
- [x] No client-side secret exposure
- [ ] Figtree + canonical RINADS design tokens only in all rendered UI

## P1 — Tenant model

Monorepo uses **`organization_id`** as tenant boundary ([ADR-005](./decisions/ADR-005-multi-tenancy.md)). Legacy docs saying `business_id` map to `organization_id`.

- [x] Organizations + organization_members (Phase 1 migration)
- [ ] Create organization on signup (app flow)
- [ ] Resolve active organization in every authenticated request
- [x] Add organization_id to service-domain tables (foundation migration)
- [x] `assign_service_order()` verified on staging (assigned + 1 task)
- [ ] Replace any client_id-only policies with tenant-aware policies

## P1 — Services domain

- [ ] Consolidate marketplace, order journey, creative studio, client portal, ops dashboard into monorepo apps
- [x] `service_orders` / `service_tasks` / `service_deliverables` / `service_earnings` schema (foundation migration)
- [x] `assign_service_order()` RPC (deterministic assignment — not RINPO)
- [x] Minimal Services UI: catalog, detail, checkout stub, `/track/[orderId]`
- [ ] Port full UI from uploaded JSX prototypes (P2)

## P1 — Automation

- [x] Edge Function scaffolds: payment-webhook, notify-whatsapp, morning-digest, health-check
- [x] Edge Functions deployed to rinads-platform staging
- [x] Razorpay webhook idempotency (`payment_webhook_events`) — schema + payment-webhook handler
- [x] Payment → order state transition (payment-webhook wired)
- [x] Assignment transaction (`assign_service_order` RPC)
- [ ] Twilio notification (wired — stub deployed)
- [ ] Invoice creation trigger
- [ ] In-app notification
- [ ] Renewal cron
- [ ] Health refresh cron

## P1 — RINPO

- [x] `rinpo_memory_facts` (runtime 2 migration)
- [x] `rinpo_conversations`, `rinpo_actions`, `rinpo_audit_log`, `rinpo_embeddings`, `rinpo_training_jobs` (foundation migration)
- [ ] Vector indexing pipeline
- [ ] Action execution with approval gates
- [ ] `match_business_data()` retrieval RPC (optional pgvector phase)

## P2 — UI consolidation

See [RINADS-50-FILE-REFACTOR-MAP.md](./RINADS-50-FILE-REFACTOR-MAP.md) for file-by-file merge targets.

## P2 — Remove legacy identity

Search production source for: Watermelon Digital, MelonIQ, `wm_`, n8n runtime deps, non-Figtree primary fonts.

Monorepo status: **clean** (no Watermelon matches in tracked source). Uploaded prototypes remain in archive/reference only.

Each match must be classified: UI identity, domain identifier, migration reference, documentation, or runtime dependency.
