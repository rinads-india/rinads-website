# Checkout architecture (Phase 09)

## Single source of truth

`CheckoutService` in `@rinads/commerce` — used by storefront only for cart→order conversion.

## Flow

1. `CartService.validate` — stock + variant existence
2. `PromotionService.validate` — optional code
3. `ShippingService.calculate` — tenant method + `freeAbove`
4. `TaxService.calculateTax` — centralized GST
5. `PaymentService.verify` — provider reference (demo: `fail_*` prefix fails)
6. `OrderService.createFromCheckout` — immutable line snapshots
7. Decrement variant stock; clear cart

## Quote vs place

- `quote()` returns totals for UI display.
- `placeOrder()` re-runs full validation — browser totals are never trusted.

## Error contract

`{ code, message, field_errors?, request_id }` via `Result<T>`.
