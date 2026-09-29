# Creative OS — PR-C0 inventory (Gate A prerequisite)

**Date:** 2026-09-30  
**Status:** INVENTORY COMPLETE — no product feature-status changes  
**Branch intent:** docs / contracts only; production `main` feature flags untouched  
**Companion blueprint:** [CREATIVE-OS-V1-IMPLEMENTATION.md](./CREATIVE-OS-V1-IMPLEMENTATION.md)

## 0. Hard boundaries (confirmed)

- Creative OS public surface is marketing-only today.
- `/platform/creative-os` reuses `OsMarketingPage`; `PLATFORM_OS` marks **Coming soon**.
- Synthetic demo must not be labeled live.
- Canonical authenticated `/os` has **no** creative module.
- No `apps/creative`, `apps/creative-worker`, or `packages/creative*` yet.
- This inventory does **not** authorize production spend, billing, or social OAuth.

## 1. Existing routes and surfaces

| Surface | Path / file | Status |
|---------|-------------|--------|
| Marketing OS page | `apps/website/app/platform/creative-os/page.tsx` | Live HTTP 200; Coming soon |
| Shared shell | `apps/website/components/system/OsMarketingPage.tsx` | Shared with other OS pages |
| IA status | `apps/website/lib/product-ia.ts` — Creative OS → `"Coming soon"` | Honest |
| Copy | `apps/website/lib/content/platform-os.ts` (`creative-os`) | Marketing |
| Pricing availability | `apps/website/lib/content/pricing.ts` — `coming_soon` | Honest |
| Synthetic demo | `apps/website/lib/os-demo-config.ts` + `OperatingSystemDemo.tsx` | Demo only |
| Services line | `apps/website/app/services/creative/page.tsx` | Services catalog, not product OS |
| Authenticated `/os` creative nav | — | **Absent** (correct for Gate A) |

Live probe 2026-09-30: `https://www.rinads.com/platform/creative-os` → HTTP 200.

## 2. Reusable package contracts (inspect before PR-C1+)

| Package | Reuse for Creative | Gap |
|---------|-------------------|-----|
| `@rinads/auth` | Session, cookie domain, portal middleware | No creative portals yet |
| `@rinads/tenancy` | Org context, feature flags, plan modules | Need creative workspace feature flag later |
| `@rinads/permissions` | Role decisions | No `creative.*` permission keys yet |
| `@rinads/billing` | Razorpay subscriptions + `usage_counters` (orders/seats) | **No credit ledger** — PR-C4 greenfield |
| `@rinads/database` | Supabase clients | No creative/credit table types |
| `@rinads/brand` | Tokens / typography | Reuse for creative-ui |

Do **not** invent a second billing system. Extend `@rinads/billing` for credits when PR-C4 starts. ERP stock ledger and salon loyalty points are unrelated.

## 3. Migrations relevant to credits / billing (existing)

| Migration | Relevance |
|-----------|-----------|
| `20260816100000_platform_saas` | Plans / org subscriptions |
| `20260817100000_phase12_marketplace_billing_domains` | `billing_*`, `usage_counters` |
| Salon loyalty / inventory ledgers | **Not** creative credits — do not overload |

No `credit_*` / `creative_*` tables exist. PR-C1 owns creative schema + RLS.

## 4. Target scaffold (deferred — not created in PR-C0)

Per blueprint §3, future packages/apps remain planned only:

```text
apps/creative/                 # optional after auth strategy review
apps/creative-worker/
packages/creative-contracts/
packages/creative-api/
packages/creative-provider-router/
packages/creative-jobs/
packages/creative-media/
packages/creative-safety/
packages/creative-ui/
```

PR-C0 deliberately does **not** scaffold these.

## 5. Docs delivered with this slice

| Doc | Purpose |
|-----|---------|
| This file | Inventory + reuse map |
| [GATE-A-CHECKLIST.md](./GATE-A-CHECKLIST.md) | Gate A acceptance evidence |
| [PACKAGE-CONTRACTS.md](./PACKAGE-CONTRACTS.md) | RFC stub: generation + credit extension points |
| Blueprint | Architecture / economics / gates A–I |

## 6. Next PR after Gate A (not started)

**PR-C1:** Organisation-scoped creative schema/migrations + RLS negative tests + audit event catalogue. Requires explicit founder approval before any production migration apply.
