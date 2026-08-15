# ERP Operations — Ambady Control Tower

**Phase:** 10  
**Branch:** `cursor/phase-10-erp-operations-4e75`

## Objective

Transform Ambady from online store + basic admin into a **canonical operational ERP** with one inventory ledger, one order lifecycle, and domain-first services before dashboard UI.

## Architecture

| Package | Role |
|---------|------|
| `@rinads/operations` | Domain services: inventory, procurement, fulfilment, returns, tasks, KPI |
| `@rinads/operations-server` | Unified in-memory adapter + commerce integration |
| `@rinads/runtime` | Event store, job runner, alert engine |
| `@rinads/commerce` | Checkout/cart wired via `InventoryPort` |

## Operational graphs

**Sales:** Customer → Order → Reservation → Sale movement → Fulfilment → Shipment → Delivery → Returns/Refunds

**Procurement:** Supplier → PO → Goods Receipt → Stock movement → Availability → Sale

## Gap matrix (Step 01)

| Area | Phase 09 | Phase 10 |
|------|----------|----------|
| Stock | Direct `variant.stock` mutation | Immutable ledger + reservations |
| Fulfilment | Status field only | Fulfilment records, pick/pack, packages |
| Procurement | None | Suppliers, PO, receipts, approval rules |
| Returns | Order status enums | Return entity + separate refunds |
| Runtime | None | Events, idempotent processors, alerts |
| RBAC | Types only | Permission keys + RLS migrations |
| Persistence | In-memory per app | Unified `@rinads/operations-server` store |
| Supabase live | Schema only | Migrations authored; cutover **PARTIAL** |

## Critical issues addressed

1. Migration conflict — `core_tenancy` stub deprecated (no-op)
2. RLS gap — commerce + operations RLS migration added
3. Competing stock logic — removed direct checkout decrement when inventory port active

## References

- [INVENTORY-LEDGER.md](./INVENTORY-LEDGER.md)
- [OMNICHANNEL-COMMERCE.md](./OMNICHANNEL-COMMERCE.md)
- [architecture/AUDIT_GAP_ANALYSIS.md](./architecture/AUDIT_GAP_ANALYSIS.md)
