# RINADS Cursor Master Prompt

Version 5.1 — Unified Business OS + RINPO + Services + Delivery Network

**Paste at the start of Cursor sessions.** Single source of truth for build decisions.

> **Tenant note:** This monorepo uses `organization_id` ([ADR-005](./decisions/ADR-005-multi-tenancy.md)). Legacy upload docs saying `business_id` refer to the same tenant boundary.

## Product identity

| Layer | Name |
|-------|------|
| Brand | RINADS |
| Core product | RINADS Business OS |
| AI | RINPO Intelligence |
| Services | RINADS Services (Build · Grow · Automate · Transform) |
| Delivery | RINADS Delivery Network (internal) |
| Verticals | RINADS Vertical OS |
| Infrastructure | RINADS Cloud |
| Domain | https://www.rinads.com |
| Positioning | Run your business from one place. |
| Philosophy | Business simplified. |

**Never:** Watermelon Digital, MelonIQ, `WM_`, `wm_`, separate agency brand, n8n runtime.

## Business OS modules

1. Customers · 2. Work · 3. Finance · 4. Growth · 5. Automation — **connected**, not isolated SaaS tools.

RINPO is cross-cutting intelligence (gold accent). **Not** the service assignment engine.

## RINADS Services order flow

```text
Service → Quote/Order → Payment → Scope → Assignment → Execution → QA
→ Client review → Revision → Approval → Delivery → Earnings → Follow-up
```

Entities: `services`, `service_orders`, `service_pods`, `service_partners`, `service_tasks`, `service_earnings`, `service_deliverables`.

Public tracker: `/track/[order_id]` — safe fields only.

## Payment & automation

- Razorpay → Edge Function `payment-webhook`
- Verify signature + idempotency
- `assign_service_order()` — deterministic routing (from legacy ai-engine logic)
- WhatsApp/email via server-side Edge Functions only
- Cron: renewals, health, digest
- **No n8n**

## RINPO

Capabilities: Understand, Remember, Explain, Detect, Recommend, Execute (approved), Automate (authorized), Forecast, Communicate, Audit.

Tables: `rinpo_conversations`, `rinpo_memory_facts`, `rinpo_actions`, `rinpo_audit_log`, `rinpo_embeddings`, `rinpo_training_jobs`.

Every consequential action → audit log.

## Design system

- Font: **Figtree only**
- Dark UI: `#000000` base, `#130020` cards, `#9f4bc7` purple, `#d4a017` RINPO gold
- Inline React `style={{}}` in legacy JSX prototypes; match tokens in Next.js components

## Engineering rules

- RLS on all tenant tables
- `private.is_org_member(organization_id)` pattern
- Never expose service role / Razorpay secrets client-side
- No fake production metrics or testimonials
- Domain-aware refactor — not mechanical find/replace

## Before implementing

1. Which module? (Customers / Work / Finance / Growth / Automation / RINPO / Services / Vertical / Cloud)
2. Existing component in monorepo?
3. Service domain vs core domain?
4. Tenant + RLS boundary?
5. Audit required?

## References

- [RINADS-50-FILE-REFACTOR-MAP.md](./RINADS-50-FILE-REFACTOR-MAP.md)
- [RINADS-UNIFIED-REFACTOR-CHECKLIST.md](./RINADS-UNIFIED-REFACTOR-CHECKLIST.md)
- [architecture/SERVICES-MIGRATION.md](./architecture/SERVICES-MIGRATION.md)

RINADS is the system. RINPO is the intelligence. RINADS Services is the execution arm.
