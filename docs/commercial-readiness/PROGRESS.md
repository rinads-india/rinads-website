# Commercial-readiness rebuild — progress

## Completed in this branch

### Phase 0
- Audit notes: `docs/commercial-readiness/PHASE-0-AUDIT.md`

### Phase 1 — P0 foundations
- Route registry (`lib/route-registry.ts`)
- ProductStatus + availability model
- CTA taxonomy + analytics foundation
- Real `/contact` (no homepage redirect)
- Lead form + `/api/leads` with validation, honeypot, dedupe
- Projects intake converted to outcome-first LeadForm
- Sitemap / robots hygiene (exclude auth, story-concept, api)
- RINPO story narrative → `/company/rinpo-story` (product remains `/rinpo`)
- Legal DPA + subprocessors route shells (non-binding until counsel)
- Internal/engineering copy rewritten on key sales surfaces
- Unverified claims softened (99.9% uptime UI, 75% metric, GST/ROI demo copy)
- Commercial readiness automated test gate

### Phase 2 — commercial layer
- Navigation: Product · Solutions · Customers · Pricing · Resources · Services · Academy
- Utility CTAs: Book a platform demo · Sign in
- Homepage section order: proof → outcomes → RINPO → OS → industries → governance → customers → pricing → implementation → CTA
- `/pricing`, `/security`, `/customers`, `/about`

### Phase 3 — ecosystem scaffolding
- `/docs`, `/developers/*`, `/integrations`, `/changelog`, `/careers`, `/status`
- Resources hub restructured around business problems

## Remaining (later phases)
- Counsel-approved Privacy / Terms / Cookies / DPA / Subprocessors copy
- Verified case studies + logos (none invented)
- Approved numeric pricing
- Wire LEAD_WEBHOOK_URL for CRM persistence
- Analytics provider sink (events are ready)
- Full responsive / a11y / performance visual QA pass
- Remove or fully quarantine `/story-concept` public HTML when ready
- Expand CI: broken-link crawl, JSON-LD schema validation against live HTML
