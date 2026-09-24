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

### Phase 4 remediation (checkup pass)
- `/story-concept` quarantined: permanent redirect to `/`; public HTML removed
- `lib/ctas.ts` is single CTA taxonomy; marketing “Start with RINADS” / signup-primary CTAs replaced
- ProductStatus wired on OS pages, solution detail, platform/solutions indexes via `OS_AVAILABILITY` / `VERTICAL_AVAILABILITY`
- Analytics sink registered in root layout (`AnalyticsProvider` → dataLayer + optional `NEXT_PUBLIC_ANALYTICS_ENDPOINT`)
- CMS `DEFAULT_SEO` synced with commercial route registry paths
- Dead surfaces removed: unused home sections, ProjectsLanding, Header, GameBackground, Rinpo3D, BeyondHero/Marquee/Portfolio, beyond-hero CSS

### Phase 4 closeout (engineering pendings)
- Lead persistence: webhook → Supabase `site_leads` (service role) → honest `{ stored: false }` ack
- Migration `supabase/migrations/20260924100000_site_leads.sql` (RLS deny-all for anon; no secrets columns)
- Optional GTM loader via `NEXT_PUBLIC_GTM_ID` (unset = current dataLayer-only behaviour)
- JSON-LD helpers (`lib/json-ld.ts`) + attach on `/`, `/pricing`, `/security`, `/about`, `/contact`, `/platform`, `/rinpo`, `/solutions`, `/customers`
- Expanded CI: sitemap/auth exclusion, H1 contract, nav link crawl, JSON-LD parse, LeadForm/ProductStatus a11y, no Three.js reintroduction
- `prefers-reduced-motion` hardening: Navbar, DynamicIslandNav, RinpoCharacter; LeadForm focuses first error
- Perf hygiene: lazy `dynamic()` RINPO character/phone islands; removed unused Three.js deps; image width/height kept
- Legal `AwaitingCounselNotice` shared on LegalPage (privacy/terms/cookies/DPA/subprocessors)

#### Performance budgets (targets — full Lighthouse needs preview URL)
| Metric | Target | Notes |
|--------|--------|--------|
| LCP | ≤ 2.5s | Hero text + brand; defer RINPO islands |
| INP | ≤ 200ms | Forms and nav; reduced-motion disables decorative loops |
| CLS | ≤ 0.1 | Explicit image dimensions on marketing assets |

Run `pnpm --filter @rinads/website build` for route/size inventory. Full Lighthouse against a preview deployment remains a manual follow-up.

## Remaining (needs human/ops — not inventable in code)
- Counsel-approved Privacy / Terms / Cookies / DPA / Subprocessors copy
- Verified case studies + logos (none invented)
- Approved numeric pricing (INR/USD)
- Production `LEAD_WEBHOOK_URL` and/or applied `site_leads` migration + service role
- Real GTM container ID (`NEXT_PUBLIC_GTM_ID`) / analytics endpoint values
- Full responsive / a11y / performance visual QA pass on preview URL (Lighthouse)
