# RINADS.com V2 — Production readiness report

Branch: `cursor/rinads-com-v2-f8da`  
Date: 2026-10-16

## Implemented changes

### P0 — Shell, taxonomy, homepage, honesty
- Single `AppShell` (Navbar + Footer + breadcrumbs); `MarketingPageShell` / `ProductPageShell` re-export it.
- Primary nav: Platform, RINPO, Solutions, Services, Customers, Resources; Sign in + Book Demo.
- Positioning: “Run your business through intelligence.” CTAs: Talk to RINPO / Explore RINADS / Book a Demo.
- Four readiness states: Available / Pilot / Preview / Roadmap (`product-status.ts` + `AvailabilityBadge`).
- Platform pillars: `/platform/business|commerce|growth|automation|intelligence|rinpo-runtime|cloud`.
- Trust hub: `/trust`, `/trust/security|availability|privacy|status`.
- Homepage: Hero → Business Pulse → Lifecycle graph → RUN/SELL/GROW/AUTOMATE → RINPO → Intelligence+Runtime → Editions → Evidence → Security → Business Readiness → Final CTA.
- Customers: four evidence classes with honest empty states.
- Services: **RINADS Implementation Services** with eight grouped offerings.
- Analytics event set extended for homepage/RINPO/readiness/demo/contact/pricing/stories.
- Permanent redirects for legacy OS, about, security, academy, nursery→landscape, business-readiness, etc.

### P1 — Experience
- `RinpoPresence` with presence states; default “RINPO • Ready”; opens Phone.
- Phone mode registry (Today/Ask/Actions/Approvals/Work/Customers/Money/Growth/Apps) with `public|authenticated|founder` audience.
- Typed page context includes industry/product hints for editions.
- `/business-readiness` with ten-area Business Operating Score; contact after value.
- `StructuredLead` typing + API support for CRM-later intake.

### P2 — Governance surfaces
- `/platform/intelligence` — Understand / Reason / Recommend / Orchestrate; providers replaceable.
- `/platform/rinpo-runtime` + `RinpoRuntimeDiagram` — permission → approval → tool → system → audit.

## Redirect table (primary)

| From | To |
|------|-----|
| `/about` | `/company` |
| `/contact` | `/company/contact` |
| `/security` | `/trust/security` |
| `/status` | `/trust/status` |
| `/academy` | `/resources/academy` |
| `/resources/business-readiness` | `/business-readiness` |
| `/platform/*-os` | pillar routes (`business`, `commerce`, `growth`, `automation`, …) |
| `/platform/rinads-intelligence` | `/platform/intelligence` |
| `/platform/rinads-cloud` | `/platform/cloud` |
| `/solutions/nursery` | `/solutions/landscape` |

## Tests / build

- Website unit/contract tests: **277 pass**
- ESLint: **0 errors** (1 pre-existing unused-var warning in commercial-readiness test)
- `tsc --noEmit`: clean after status migration fixes
- Playwright smoke: hero assertion updated to “through intelligence” (run in CI)

## Remaining gaps

- Full conversational RINPO lead wizard UI is typed/API-ready; progressive chat collection is still partial (Ask mode + LeadForm remain primary capture).
- Use-case child pages are stubs — intentional for P0/P1 SEO scaffolding, not deep content.
- Company founder/story pages are thin stubs pending approved copy/assets.
- Customers evidence lists remain empty until approved material exists (correct).
- Heavy 3D/Unity/voice still lazy and not default-loaded (correct per brief).
- Authenticated/founder Phone modes show placeholders for Work/Customers/Money — evolve with OS data later.
- Manual mobile CWV / Lighthouse not re-run in this agent pass — recommend preview Lighthouse before production promote.

## Security / compliance

- No invented certifications.
- No path that implies direct model → production mutation; Runtime copy reinforces permission/approval/audit.
- Demo/sample labels on Business Pulse and demos.

## SEO

- Route registry updated for new indexable paths; legacy paths marked non-indexable with canonicals where applicable.
- Recommend verifying sitemap generation against new routes on preview deploy.

## Recommended next deployment step

1. Merge PR after CI (lint/typecheck/test/build + Playwright smoke) is green.
2. Smoke preview: `/`, `/platform/rinpo-runtime`, `/business-readiness`, `/customers`, redirect `/about` → `/company`.
3. Confirm Vercel production env contract still passes.
4. Promote to production; monitor analytics for `homepage_view` / `rinpo_opened` / `business_readiness_*`.
