# Payment flow (Phase 09)

## Abstraction

`PaymentService` accepts `{ provider, reference, amount, currency }` and returns `{ status, providerRef }`.

## Demo provider

- Reference required.
- Prefix `fail_` simulates provider decline.
- All other references → `paid`.

## Production path (Phase 10+)

- Configure Razorpay/Stripe webhook → verify signature → call `PaymentService.verify` with provider payload.
- Store only `provider`, `provider_ref`, `amount`, `status` in `payments` table.
- **Never** persist PAN/CVV/expiry.

## RINPO constraint

`RINPO_HARD_LIMITS.canSubmitPayment = false` — assistant cannot complete payment.
