# Storefront architecture (Phase 09)

## App

`apps/storefront` — public Ambady shop (port 3001).

## Routes

| Route | Purpose |
|---|---|
| `/` | Featured products |
| `/shop` | Catalog + category filter |
| `/search?q=` | Search + sort |
| `/products/[slug]` | PDP with variant selector |
| `/cart` | Cart management |
| `/checkout` | Server-validated checkout |
| `/orders/[id]/track` | Guest/customer order timeline |

## Data flow

```
Page (RSC) → @rinads/commerce-server → domain services → in-memory store
Server actions / API → CheckoutService.placeOrder (price/stock/tax/shipping revalidated)
```

## Header

Logo, search, shop, account link (customer portal), cart count, RINPO entry.

## Rules

- Draft products never listed (`status === 'published'` only).
- Images lazy-loaded via `next/image` with remote fallback.
- Mobile filters in drawer; desktop sidebar on `/shop`.
