# Inventory Ledger

All stock mutations flow through `StockLedgerService.recordMovement()` in `@rinads/operations`.

## Formula

```
on_hand = sum(movements.quantity_delta) per variant per location
reserved = sum(active reservations.quantity)
available = on_hand - reserved
```

## Movement types

`purchase`, `sale`, `reservation`, `reservation_release`, `adjustment`, `damage`, `loss`, `return`, `transfer_in`, `transfer_out`, `opening_balance`

## Rules

- Movements are **immutable** — never overwrite stock counters
- Adjustments require a **reason** and operator
- Commerce checkout converts cart reservations to `sale` movements
- `ProductVariant.stock` is a **read projection** synced from ledger

## Database

Table: `stock_movements` — see `supabase/migrations/20260815100001_operations_erp.sql`
