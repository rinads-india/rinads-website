# Inventory Truth Hardening (PR-K3)

## Objective

Remove scalar `product_variants.stock` from authoritative checkout decisions without rewriting the existing commerce or operations domains.

## Canonical truth

Production inventory availability is owned by `@rinads/operations` `StockLedgerService`:

```text
on_hand = tenant-scoped stock movement sum
reserved = active, unexpired tenant-scoped reservations
available = max(0, on_hand - reserved)
```

The commerce `ProductVariant.stock` field remains a compatibility/read projection only.

## Checkout boundary

`CheckoutService.placeOrder()` now fails closed with `INVENTORY_UNAVAILABLE` when no `InventoryPort` is supplied.

Production `@rinads/operations-server` supplies an `InventoryPort` backed by `StockLedgerService`, so cart validation, reservation, sale conversion and projection refresh all use the ledger path.

The standalone `@rinads/commerce-server` retains a deliberately named `createLegacyVariantStockInventoryPort()` for isolated demo/legacy flows. This is the only compatibility path permitted to decrement scalar variant stock directly.

## Reservation hardening

`StockLedgerService.reserveForCart()` now:

1. releases prior holds for the same cart (idempotent replacement),
2. aggregates duplicate variant lines,
3. validates the complete request before writing any new reservation,
4. creates holds only after every requested quantity passes.

This prevents partial reservations when a later line fails.

## Tenant isolation

`getBalance()` scopes movements and reservations to `ctx.organizationId` before computing on-hand or reserved quantities. Availability must not depend on another tenant even if identifiers collide in fixtures, imports or malformed data.

## Compatibility mutations

Direct `variant.stock` writes are architecture-guarded. Allowed sites are limited to:

- `packages/commerce-server/src/legacy-inventory.ts` — legacy/demo compatibility adapter;
- `packages/operations-server/src/seed.ts` — read projection synchronization from the canonical ledger.

New stock mutations must go through inventory operations.

## No schema migration

K3 changes service boundaries and tests only. It does not add or apply a production database migration.

## Verification targets

Tests cover:

- stale-high scalar projection cannot permit overselling;
- stale-low scalar projection cannot incorrectly block valid ledger stock;
- cross-organization movements/reservations are ignored;
- expired/released reservations do not reduce availability;
- failed multi-line reservation leaves no partial hold;
- duplicate variant requests are aggregated before availability checks;
- checkout without an inventory provider fails closed.

## Next

PR-K4 will address transaction boundaries and atomicity across mutation + audit + canonical event/outbox flows. K3 does not claim payment/order/inventory conversion is yet one database transaction.
