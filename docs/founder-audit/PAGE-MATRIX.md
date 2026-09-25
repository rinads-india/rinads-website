# Current vs required page matrix

**Audit date:** 2026-09-25  
**Source of routes:** `apps/website/lib/route-registry.ts`, app routers, live probes of listed hosts.  
**Required IA (founder brief):** Platform, Solutions, Customers, Pricing, Resources, Services, Academy, Company — plus `/os` and R GLOW. Inspired by enterprise information architecture; **not** a copy of any third-party brand.

Labels: see [PRODUCTION-TRUTH.md](./PRODUCTION-TRUTH.md).

## Marketing / commercial (www.rinads.com)

| Required surface | Actual route(s) | Status | Defects / gaps | Fix / acceptance |
|------------------|-----------------|--------|----------------|------------------|
| Home | `/` | DEPLOYED | None blocking from HTTP probe | Keep brand hero; no speculative redesign |
| Platform hub | `/platform` + OS subroutes | DEPLOYED / BUILT | ProductStatus must stay accurate | Verify ProductStatus vs OS_AVAILABILITY |
| Solutions | `/solutions` + verticals | DEPLOYED / BUILT | Healthcare/logistics “coming soon” must stay honest | No false “available” badges |
| Customers | `/customers` | DEPLOYED | No verified logos/case studies | BLOCKED content until evidence |
| Pricing | `/pricing` | DEPLOYED | No approved numeric price list | Contact/custom language only until approved |
| Resources | `/docs`, `/developers/*`, `/integrations`, `/changelog`, `/status` | BUILT / DEPLOYED | Depth varies | Expand only with verified content |
| Services | `/services*` | BUILT | Checkout E2E unpaid without Razorpay creds | PARTIAL |
| Academy | `/academy` + programmes | DEPLOYED | — | Preserve Real Experience Academy framing |
| Company | `/about`, `/company/*`, `/careers` | BUILT | — | — |
| Security | `/security` | DEPLOYED | No fabricated certifications | Keep architecture/process language |
| Contact / demo | `/contact` | DEPLOYED | DB persistence unproven live | Accept: validation errors, honeypot, honest `stored` ack |
| Project intake | `/projects` | DEPLOYED / PARTIAL | #70 guided intake not on main; current LeadForm path | Disposition #70 vs current form |
| RINPO product | `/rinpo`, `/rinpo/intelligence`, `/rinpo/voice`, `/rinpo/phone` | DEPLOYED / PARTIAL | Voice/Phone ≠ live telephony | Label capability boundaries |
| Legal | `/legal/*` | BUILT | Awaiting counsel | Do not remove notice |
| Business OS | `/os/*` | DEPLOYED (gate) | Authed E2E BLOCKED | See SECURITY-TENANCY |
| Quarantined | `/story-concept` | MERGED | Redirects to `/` | Keep quarantined |

## Business OS modules

| Module | Route | Status | Notes |
|--------|-------|--------|-------|
| Home / Command Centre | `/os`, `/os/home` | MERGED (#78) | Live loaders RLS-backed; demo tagged |
| Customers | `/os/customers` | PARTIAL | Bridge destinations; empty-state honesty follow-up |
| Work | `/os/work/*` | PARTIAL | — |
| Money | `/os/money` | PARTIAL | Privileged bridges need roleKey |
| Growth | `/os/growth` | PARTIAL | — |
| Automate | `/os/automate` | PARTIAL | — |
| Rooms | `/os/rooms` | PARTIAL | Live empty per #78 design |
| Settings | `/os/settings` | PARTIAL | — |

## R GLOW (glow.rinads.com)

| Required | Actual | Status | Notes |
|----------|--------|--------|-------|
| Login | `/login` | DEPLOYED | Brand assets #76 |
| Operator console | `/dashboard`, `/calendar`, `/pos`, `/clients`, … | BUILT | Authed smoke BLOCKED |
| Public booking | `www` `/solutions/salon/book` | PARTIAL | Not full Digital Store |
| Digital Store | — | PLANNED | Do not claim launched |
| Staff phone app | — | PLANNED | `/staff` is admin roster only |
| Communications | `/communications` | BUILT / BLOCKED ops | Worker + Twilio founder-gated |

## Defect backlog (measured → implement in Phase 2+)

1. **P0:** Confirm production lead persistence (migration + env) — ops, not copy invent.
2. **P1:** Page-matrix a11y/responsive QA on preview (Lighthouse) — scores only after measurement.
3. **P1:** OS bridge empty states for modules without real destinations.
4. **P2:** Enterprise outcome-journey copy polish without redesign.
5. **P2:** Close or rebase #70; disposition #36 vs GTM path.

## Acceptance for “page done”

- Route returns 200 (or intentional auth redirect).
- H1 / ProductStatus / JSON-LD contracts from commercial tests still pass in CI.
- No unverified customer, price, or certification claims.
- Forms: client validation, server validation, honest persistence ack.
