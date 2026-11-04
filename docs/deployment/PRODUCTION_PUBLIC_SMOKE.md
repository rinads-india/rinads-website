# Production public smoke (read-only)

The hourly GitHub Actions workflow `.github/workflows/production-health.yml`
runs `scripts/ops/production-public-smoke.mjs` under Node 22. It may also
be invoked manually through the **Production health** workflow. It uses only
GET requests, no credentials, no session cookies, no database mutations,
no customer messages, no payments, and no Runway session startup.

## Checks

- All seven canonical public health endpoints: website, platform admin,
  owner portal, customer portal, salon pilot, clients and creators.
- GET public marketing routes: homepage, pricing, contact, solutions,
  RINPO, business readiness and signup; homepage HTML must include
  the approved **Business, simplified.** and **Synthetic demo** labels.
- Anonymous GET `/os` must redirect to canonical `/signup` with
  `next=/os`. A 200 response for anonymous OS is a failure.
- GET `/api/rinpo/live` returns a valid boolean `enabled`.
  `enabled:false` is a **passing disabled feature state**, not evidence
  that live voice/avatar sessions work.

Every result appears in the GitHub Actions job summary. The workflow exits
nonzero if any hard check fails. Requests have 10-second timeouts and one
bounded retry; no attempts mutate business state.

## Local execution

```bash
node --test scripts/ops/production-public-smoke.test.mjs
node scripts/ops/production-public-smoke.mjs
```

Production monitors cannot certify an end-to-end business operating system.
**Before describing RINADS as transaction-ready**, separately verify:

1. Production Supabase project access, actual migration ledger, exposed-schema
   RLS and cross-tenant denial tests using isolated test identities.
2. Email-confirmed signup, first organization and membership, invite flow,
   entitlement/provisioning, and real tenant data isolation.
3. Razorpay test-mode checkout/webhook dedup and subscription activation,
   then an explicitly approved low-value live payment/refund if required.
4. WhatsApp opt-in/opt-out, signed webhook validation, test allowlist delivery,
   retry/DLQ and operator audit.
5. RINPO Runtime policy/approval/execute/verify/audit with safe sandbox tools;
   live video capability is independently gated.

Do not pass real customer details, service-role keys or payment secrets into
GitHub Actions logs. Repository branch protection must separately require
CI checks; a monitoring workflow cannot substitute for GitHub rulesets.
