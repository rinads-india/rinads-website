# Product variants (Phase 09)

## First-class model (non-negotiable)

```
product_variants (id, product_id, name, sku, price, compare_at, stock, weight, status)
```

Rejected: `variants: ["500 g", "1 kg"]` string arrays or ambiguous product-level stock.

## Ambady seed

Ambady Premium Pebbles:

| Variant | SKU | Price | Stock |
|---|---|---|---|
| 500 g | PEB-500G | ₹149 | 120 |
| 1 kg | PEB-1KG | ₹279 | 85 |
| 5 kg | PEB-5KG | ₹1199 | 32 |

## Owner editor

`/products/[id]/edit` — variants table with per-row price/stock/SKU.

## Cart / checkout

All lines reference `variant_id`; snapshots capture name, sku, unit price at order time.
