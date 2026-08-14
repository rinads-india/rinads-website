# Commerce security (Phase 09)

## Payment trust boundary

- **Never store** card PAN, CVV, or expiry in Postgres, logs, or localStorage.
- Payment verification happens server-side via `PaymentService.verify()` using provider references only.
- RINPO cannot submit payment or bypass checkout confirmation (`RINPO_HARD_LIMITS`).

## Tenant isolation

- All commerce tables are scoped by `organization_id`.
- Supabase RLS policies enforce org membership for owner/staff routes.
- Customer routes must pass `customerId` to `OrderService.getById()` and `SupportService.getById()` to prevent IDOR.

## Legacy migration — BLOCKED

Legacy sources (`apg.catalog.v1`, `hap.orders.v1`) were **not provided**. Migration pipeline is documented but not executable:

1. Import catalog JSON → `products` + `product_variants` (never string-array variants).
2. Import orders → immutable `order_lines` snapshots.
3. **Strip forbidden fields**: `cardNumber`, `cardCvv`, `cardExp` — map to `payment_status=unknown_legacy` or provider token only.
4. Keep legacy JSON as backup/export only.

Until legacy source is supplied, Phase 09.10 and Steps 103–104 remain **BLOCKED**.

## IDOR test checklist

| Resource | Guard |
|---|---|
| Order detail (customer) | `customerId` match |
| Address | `customerId` on row |
| Support ticket | `customerId` match |
| Owner product edit | `organizationId` match |

## XSS / CSRF

- Next.js server actions for mutations; no inline event handlers with unsanitized HTML.
- Checkout totals always recomputed server-side — never trust browser price/discount/shipping/tax.
