# Shipping flow (Phase 09)

## Configuration

Tenant `shipping_methods` row: `code`, `name`, `base_rate`, `free_above`.

Ambady seed: `standard` — ₹49 base, free above ₹999.

## Calculation

`ShippingService.calculate(ctx, methodCode, cartSubtotal)`:

- If `subtotal >= freeAbove` → ₹0
- Else → `baseRate`

## Cart UX

`CartService.freeShippingProgress` exposes `{ remaining, threshold }` for progress UI when rules exist.

## Rules

- Single config source per tenant — no duplicated free-shipping logic in components.
- RINPO cannot override shipping (`canOverrideShippingTax: false`).
