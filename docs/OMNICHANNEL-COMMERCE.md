# Omnichannel Commerce — Phase 09 Gap Matrix

**Date:** 2026-08-14  
**Path:** Greenfield (no `apg.catalog.v1` / `hap.orders.v1` in repo)  
**Principle:** One commerce core. Multiple experiences. One customer identity. One order truth. One RINPO.

## Decision gate

| Option | Status |
|--------|--------|
| Import legacy Ambady/APG JSON | **BLOCKED** — source not in repository |
| Greenfield commerce build | **APPROVED** — Phase 09 implements canonical domain first |

Legacy migration (Steps 103–104, 117) remains **BLOCKED** until backup files are provided.

## Step status matrix (Steps 01–120)

| Step | Topic | Status |
|------|-------|--------|
| 01 | UI forensics | **partial** — marketing/RINPO audited; commerce apps new |
| 02 | Design system | **partial** — `@rinads/ui` extended in Phase 09 |
| 03 | Responsive breakpoints | **partial** — tokens + app layouts |
| 04 | Mobile first | **partial** — storefront mobile nav |
| 05 | Tablet | **partial** — adaptive grids in storefront |
| 06 | Desktop | **partial** — wide layouts in owner portal |
| 07 | Accessibility | **partial** — semantic HTML, aria, focus |
| 08 | Storefront IA | **implemented** — core routes |
| 09 | Header | **implemented** |
| 10 | Search | **implemented** — domain SearchService |
| 11 | Search UX | **partial** — recent/popular when data exists |
| 12 | Search empty state | **implemented** |
| 13 | Filters | **partial** — category, price, availability |
| 14 | Sort | **implemented** — supported metrics only |
| 15 | Product card | **implemented** |
| 16 | Product image | **implemented** — fallback + lazy |
| 17 | Product detail | **implemented** — variants, gallery |
| 18 | Variant model | **implemented** — first-class `product_variants` |
| 19 | Variant stock | **implemented** |
| 20 | Variant price | **implemented** |
| 21 | Cart | **implemented** |
| 22 | Cart validation | **implemented** — server revalidation |
| 23 | Cart recovery | **partial** — guest local + auth server cart |
| 24 | Cart intelligence | **partial** — free-shipping progress |
| 25 | Checkout | **implemented** |
| 26 | Guest checkout | **implemented** |
| 27 | Customer identity | **partial** — profile model; Supabase auth deferred |
| 28 | Address book | **implemented** |
| 29 | Pincode validation | **missing** — no serviceability rules yet |
| 30 | Shipping methods | **implemented** — tenant-configured |
| 31 | Shipping calculation | **implemented** — centralized |
| 32 | GST | **implemented** — TaxService |
| 33 | Payment | **partial** — abstraction + mock verify |
| 34 | Payment confirmation | **implemented** — server verify only |
| 35 | Order creation | **implemented** — transactional in-memory |
| 36 | Order snapshot | **implemented** |
| 37 | Order confirmation | **partial** — runtime adapter stub |
| 38 | Order tracking | **implemented** |
| 39 | Order timeline | **implemented** |
| 40 | Order exceptions | **partial** — key states modeled |
| 41 | Customer portal | **implemented** — core sections |
| 42 | Customer dashboard | **implemented** |
| 43 | Wishlist | **implemented** |
| 44 | Recently viewed | **implemented** |
| 45 | Reviews | **partial** — model + moderation fields |
| 46 | Review moderation | **partial** — owner approve/reject |
| 47 | Notifications | **partial** — in-app list |
| 48 | Preferences | **implemented** |
| 49 | RINPO customer UX | **implemented** — cross-app shell |
| 50 | RINPO context | **implemented** |
| 51 | RINPO product actions | **implemented** |
| 52 | RINPO checkout limits | **implemented** |
| 53 | RINPO order support | **implemented** |
| 54 | Customer memory | **partial** — bridges local + server prefs |
| 55 | Personalized store | **partial** — recommendations service |
| 56 | Personalization fallback | **implemented** |
| 57 | Promotions | **implemented** |
| 58 | Promotion validation | **implemented** |
| 59 | Discount stacking | **implemented** — explicit policy |
| 60 | Free shipping | **implemented** — single `freeAbove` config |
| 61 | Inventory reservation | **partial** — checkout reservation |
| 62 | Abandoned cart | **partial** — signal only, no auto-message |
| 63 | Customer lifecycle | **partial** |
| 64 | B2B / bulk | **partial** — quote request model |
| 65 | Bulk enquiry | **implemented** |
| 66 | Service requests | **implemented** |
| 67 | Support tickets | **implemented** |
| 68 | Ticket states | **implemented** |
| 69 | RINPO support | **implemented** |
| 70 | Customer communication | **partial** — notification adapter stub |
| 71 | Mobile navigation | **implemented** |
| 72 | RINPO mobile UI | **implemented** |
| 73 | PWA | **missing** — not in scope for sprint A |
| 74 | Offline | **missing** |
| 75 | Loading states | **implemented** |
| 76 | Error UX | **implemented** |
| 77 | Empty states | **implemented** |
| 78 | Form validation | **implemented** |
| 79 | API error contract | **implemented** |
| 80 | Request correlation | **implemented** |
| 81 | Performance | **partial** — pagination, lazy images |
| 82 | Pagination | **implemented** |
| 83 | Admin product experience | **implemented** |
| 84 | Product editor | **implemented** |
| 85 | Product media | **implemented** |
| 86 | Bulk product management | **partial** |
| 87 | Product import | **blocked** — Phase 03 pipeline not in repo |
| 88 | Import review | **blocked** |
| 89 | Image matching | **blocked** |
| 90 | Catalog publishing | **implemented** |
| 91 | SEO | **partial** — slug, meta fields |
| 92 | URL safety | **partial** — slug uniqueness |
| 93 | Analytics | **partial** — event types defined |
| 94 | Analytics privacy | **partial** |
| 95 | Owner dashboard | **implemented** |
| 96 | Staff dashboard | **partial** — RBAC-scoped views |
| 97 | Account security | **partial** — demo + model |
| 98 | IDOR protection | **implemented** — tests |
| 99 | Tenant isolation | **implemented** — org scoping + tests |
| 100 | Order security | **implemented** |
| 101 | Checkout security | **implemented** |
| 102 | Payment security | **implemented** — no PAN/CVV storage |
| 103 | Data migration | **blocked** |
| 104 | Legacy backup | **blocked** |
| 105 | Export | **partial** |
| 106 | Backup | **partial** — documented |
| 107 | Restore test | **missing** |
| 108 | Observability | **partial** |
| 109 | UI regression | **partial** — test scaffolding |
| 110 | Critical journeys | **partial** — unit + integration |
| 111 | Failure journeys | **partial** |
| 112 | Performance targets | **partial** |
| 113 | Design quality | **partial** |
| 114 | Animation | **partial** — reduced-motion respected |
| 115 | Security audit | **partial** |
| 116 | Data audit | **partial** |
| 117 | Legacy audit | **implemented** — notes in COMMERCE-SECURITY.md |
| 118 | Testing | **partial** |
| 119 | Documentation | **implemented** |
| 120 | Final report | **implemented** — PHASE_09_COMPLETION_REPORT.md |

## Reusable from Phase 0

- `@rinads/brand` tokens (Figtree, `#9F4BC7`)
- `@rinads/permissions` RBAC types
- `apps/website` RINPO phone UI patterns
- `useRinpoMemory.ts` (client bridge until Supabase live)

## Architecture

See [STOREFRONT-ARCHITECTURE.md](./STOREFRONT-ARCHITECTURE.md) and package layout:

- `packages/commerce` — domain services
- `packages/commerce-server` — persistence adapters + seed
- `packages/intelligence` — RINPO tools + context
- `apps/storefront`, `apps/customer-portal`, `apps/owner-portal`
