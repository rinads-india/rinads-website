# Subscriptions (foundation)

Phase 11 adds schema only — no live Razorpay/Stripe billing.

## Tables

- `plans` — catalog with JSONB `limits` (modules, seats, orders/month)
- `organization_subscriptions` — one active subscription per org
- `organization_limits` — optional denormalized cache

## Attachment

On `provision_tenant`, default plan is `starter` (website onboarding) or selected plan (platform admin).

## Enforcement

`@rinads/platform` `planIncludesModule()` gates module visibility in platform-admin plans UI.

Domain guards use feature flags + plan limits — read-only messages, not billing webhooks.

## Status

**PARTIAL** — schema + attachment complete; usage metering and payment webhooks deferred to Phase 12+.
