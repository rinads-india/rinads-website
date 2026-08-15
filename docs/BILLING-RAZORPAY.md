# Billing — Razorpay

Platform subscription billing (separate from B2C checkout payments).

## Package

`@rinads/billing` — Razorpay provider, webhook handler, usage metering.

## Env

```bash
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

## Webhook

POST `/api/webhooks/razorpay` on platform-admin (signature header `x-razorpay-signature`).

Events handled:

- `subscription.activated` / `subscription.updated` → `organization_subscriptions` + `billing_subscriptions`
- `payment.failed` → `organization_subscriptions.status = past_due`

Idempotency via `billing_events (provider, idempotency_key)`.

## Stripe

Stub only — `NOT_IMPLEMENTED` (Phase 13).
