# Product media (Phase 09)

## Schema

`product_media`: `product_id`, optional `variant_id`, `url`, `alt_text`, `sort_order`, `is_primary`.

## Rules

- One primary image per product for cards/search.
- Variant-specific media optional (nullable `variant_id`).
- PDP renders sorted gallery; lazy load + alt text required.

## Storefront

`next/image` with `images.unsplash.com` remote pattern for demo seed assets.
