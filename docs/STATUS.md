# RINADS end-to-end status (as of `main`)

**Verdict:** RINADS is a multi-app SaaS + commerce/ERP + salon OS monorepo. Platform Phases 9–13 and **R GLOW MVP + Phase E/E.2 are code-complete on `main`**. Remaining work is mostly **live credentials/ops cutover**, **provider stubs outside salon WhatsApp**, **LLM/intelligence depth**, and **CMS/polish**—not missing core product surfaces.

Latest merged work: salon login → R GLOW (#57), MVP operator closure (#56), E.2 loyalty/reviews/comms (#53–#55).

## Architecture

```text
Supabase Auth → @rinads/tenancy
                      ↓
    @rinads/commerce | @rinads/operations | @rinads/salon (+ *-server)
                      ↓
              @rinads/runtime (events, outbox, workflows, workers)
                      ↓
         PostgreSQL + RLS  |  Edge Functions  |  cron scripts
```

## What is built

### Apps (6)

| App | Role | Status |
|-----|------|--------|
| `apps/website` | Marketing, OS pages, onboarding, Services catalog/checkout/track, RINPO UI | Built |
| `apps/rinaglow` | **R GLOW** Salon OS console | Built (MVP closed) |
| `apps/storefront` | Omnichannel shop | Built |
| `apps/customer-portal` | Customer account | Built |
| `apps/owner-portal` | Merchant ERP UI | Built |
| `apps/platform-admin` | Founder control plane, CMS, billing events | Built |

### Platform packages (built)

- **CORE:** `auth`, `permissions`, `database`, `tenancy`, `shared`, `brand`, `ui`
- **Commerce:** `commerce`, `commerce-server`
- **ERP:** `operations`, `operations-server`, `runtime`
- **SaaS:** `platform`, `billing` (Razorpay), `domains`, `cms`
- **Salon:** `salon`, `salon-server`
- **Intelligence:** `intelligence` (deterministic NLU + tool registry)

### Backend

- Supabase migrations (tenancy → commerce → ERP → SaaS → runtime → CMS → services → salon OS → loyalty/reviews/comms)
- Edge Functions: `payment-webhook`, `notify-whatsapp`, `notify-whatsapp-webhook`, `morning-digest`, `health-check`
- Cron scripts: provisioning, runtime, communications workers under `scripts/cron`

### Product phases already on `main`

1. Monorepo + CORE identity/RLS + CI
2. Phase 9 — Omnichannel commerce + Ambady seed
3. Phase 10 — ERP operations + RINADS Runtime
4. Phase 11 — SaaS control plane + onboarding
5. Phase 12 — Marketplace, Razorpay billing, custom domains, metering
6. Phase 12 Runtime 2 / 13 — Persistent jobs + authoritative worker
7. CMS + SEO (admin + storefront)
8. Services v5.1 — catalog, Razorpay checkout, order tracker
9. Marketing OS — platform pages, Grow, Business OS, RINPO branding
10. **R GLOW** Phases D → E → E.2 → MVP operator closure

## R GLOW status

**Product:** Salon OS vertical — console `@rinads/rinaglow`, host `glow.rinads.com`, packages `salon` / `salon-server`.

**Code status: MVP + Phase E complete.** Recent PRs #47–#57.

### Shipped journeys

- **Foundation / Phase D:** auth, branches, services, staff, bookings, POS, CRM notes, events, RINPO salon tools
- **Phase E Slice 1:** segments → campaigns → Twilio delivery states → attribution → growth intelligence → RINPO
- **Phase E.2:** loyalty (`/loyalty`), reviews/recovery (`/feedback/[token]`), communications ops + worker
- **MVP operator closure (#56):** calendar walk-in/phone booking, Today/Upcoming, settings booking readiness, RINPO appointment context, dashboard low-rating queue
- **Login routing (#57):** salon login routes into R GLOW

### Console routes (built)

`/dashboard`, `/calendar`, `/pos`, `/services`, `/staff`, `/clients`, `/growth`, `/loyalty`, `/campaigns`, `/communications`, `/settings`, public `/feedback/[token]`

### Still pending for R GLOW (ops, not missing features)

1. **Live Twilio WhatsApp** — code path ready; without secrets returns `not_configured`; credentialed E2E not verified
2. **Production enablement** — Vercel `glow.rinads.com`, migration rollout, cookie domain, Twilio templates/webhooks/consent
3. **Workers default off** — need `RINADS_COMMUNICATIONS_WORKER_ENABLED=1` (+ allowlist)
4. **Loyalty expiry batches** — shipped (`points_expiry_days` + `pnpm loyalty-expiry:worker`; off by default until enablement)

**Go-live checklist:** [deployment/RGLOW_PRODUCTION_CUTOVER.md](./deployment/RGLOW_PRODUCTION_CUTOVER.md)

**Bottom line:** product code is launch-ready; go-live = deploy + secrets + worker enablement + one real Twilio send.

## Pending across the wider platform

| Area | Status |
|------|--------|
| Live Twilio (salon) | Code ready; needs secrets + ops validation |
| Runtime email/WhatsApp adapters | Honest `not_configured` + optional webhook / notify-whatsapp (no fake success) |
| Stripe billing | `NOT_IMPLEMENTED` |
| Razorpay subscriptions | Stub / plans-on-provision; live E2E needs credentials |
| LLM-backed RINPO chat | Deterministic default; optional `LlmRinpoNluAdapter` via `RINADS_RINPO_LLM_API_KEY`; website `/api/chat` still rule-based |
| RINPO vector/embeddings | Schema present; indexing + `match_business_data` pending |
| Edge `morning-digest` / `health-check` | Scaffolds incomplete |
| CMS Phase C | Blog, preview tokens, Storage uploads, i18n — see [CMS_PHASE_C.md](./CMS_PHASE_C.md) |
| Website forms / OAuth | Fake submit; Google/LinkedIn “coming soon” |
| Grow → storefront checkout | Not wired |
| Full Playwright E2E | Deferred |
| Design tokens / Figtree everywhere | Incomplete |
| Invoice / in-app notify / renewal / health crons | Checklist leftovers |
| Formal GL/accounting, DLQ replay UI | Deferred |
| Legacy Ambady import | Blocked (no source data) |

## Suggested next focus

1. Execute [RGLOW_PRODUCTION_CUTOVER.md](./deployment/RGLOW_PRODUCTION_CUTOVER.md)
2. Credentialed WhatsApp send + webhook status transitions
3. After salon launch: Razorpay live subscriptions, CMS Phase C, RINPO LLM depth
