# RI GROWTH — Search Intelligence pilot

**Status:** Proposed pilot, draft PR; NOT production-live.  
**Owner:** RINADS TECHNOLOGIES  
**Target:** November 14, 2026 launch gate, subject to verification.  
**Canonical path:** `/grow/search-intelligence` (one public landing page, not a second product or app).

## Decision

Extend RI GROWTH inside the existing multi-tenant RINADS platform. RINADS INTELLIGENCE proposes and explains; RINPO RUNTIME governs any supported execution. Keep `organization_id` as the tenant boundary. Do not place customer credentials or operational workflows in n8n.

The 181-page, unofficial **Search Central Live Bengaluru 2026** attendee recap informs the design. Particularly relevant slides: 18–20 and 39 (good SEO supports AI discovery), 27–30 (canonical URLs), 32–34 (multilingual strategy), 85–88 and 148 (Discover content), 96 (Preferred Sources), 164–169 (AI SEO myths). This event recap is **not** an endorsement of RINADS or a guarantee of SEO outcomes.

## Scope and deliverables

### Phase 0: Public pilot and internal baseline

- Publish a truthful pilot page and link it from existing Growth surfaces.
- Register one canonical/indexable route in `lib/route-registry.ts` so the sitemap includes it.
- Use the existing `/contact?intent=audit` intake; do not add an unreviewed form or new storage.
- Run the read-only technical audit script against public RINADS pages after deployment. It does not use Search Console, indexation data or rankings.
- Verify metadata, sitemap inclusion, robots rules, canonical, JSON-LD and links in Vercel preview before merge.
- Submit sitemap to Google Search Console only after domain ownership is verified; a sitemap does not guarantee indexing.

### Phase 1: Consented reporting (post-launch gated work)

- Create a provider adapter for Google Search Console with explicit OAuth and minimum necessary scopes; verify current API behavior and quotas in docs.
- Store provider tokens encrypted server-side; never return tokens to browser, logs, URLs, n8n or the LLM.
- Use RLS keyed to `organization_id`, owner-checked access, revocation handling, idempotent sync jobs, retry/backoff and audit events.
- Keep any AI-specific Google performance reporting separate unless an official programmatic export is confirmed. Do not invent AI citation metrics.
- First reporting model: daily snapshots per property, date, page, query, clicks, impressions, CTR and average position where API permissions permit. Avoid treating search impressions as conversions.
- GA4 and CRM conversions require separate consent and an attribution model; do not imply their totals are interchangeable.

### Phase 2: Governed recommendations

- Deterministic checks first: canonical, noindex, titles, description, sitemap inclusion, internal links, rendering, local business data.
- RI proposes prioritized actions with evidence, cost, severity and expected business impact.
- RINPO RUNTIME: OBSERVE → CONTEXT → POLICY → PLAN → APPROVAL → EXECUTE → VERIFY → AUDIT.
- Any publishing, listing changes, review replies or communication requires scoped permission and owner approval, rollback and audit evidence.

## Pilot customer selection

Start with RINADS itself and a small group of opted-in Kerala SMBs (e.g. salon, bakery, landscape/nursery). Never access client accounts based solely on an existing service relationship. Obtain consent and a written scope first.

## Pricing hypothesis — internal only, not approved public pricing

- Monitoring: ₹2,999 per business per month.
- Managed: ₹8,999 per business per month.
- Pro: ₹17,999 per business per month.
- One-time onboarding: ₹4,999, excluding substantial implementation and ad spend.

Do **not** publish prices as canonical rates until reconciled with the existing commercial config and pricing PR. Test delivery workload per account first. Ten managed customers at ₹8,999 generate ₹89,990 MRR; at an illustrative ₹3,500 variable cost each, contribution is ₹54,990 before overhead, acquisition cost and tax. This is a scenario, not expected ROI.

## Metrics

- Connected and authorized properties; properties successfully synced; sync freshness.
- Indexable URL coverage; verified critical crawler errors; technical issue resolution time.
- Non-branded organic search clicks, impressions, local leads, bookings and confirmed revenue where correctly attributable.
- Monthly active paying customers; MRR; cost to serve; contribution margin; churn; time to first useful recommendation.
- Do not invent a universal “AI visibility score” or promise citations.

## Release gates

1. Feature branch and draft PR; no direct main push.
2. `pnpm install --frozen-lockfile`; lint; typecheck; tests; website build.
3. Vercel preview loads without runtime errors; validate mobile layouts, CTA, SEO tags and sitemap.
4. Contact intake actually receives a test submission; no fake confirmation.
5. Domain-level Google Search Console ownership and indexing status checked using authorized access.
6. Founder review before merge or production promotion; no database migration or OAuth secret changes in this phase.

## Technical risk notes

- `robots.ts` and `sitemap.ts` already exist; do not replace them or confuse their presence with verified indexation.
- `/grow` itself is not in the central registry, but this landing page is explicitly registered.
- Canonical and sitemap URL construction uses `NEXT_PUBLIC_SITE_URL`; audit the deployed value before promotion.
- Search engines are free to ignore recommendations; ranking and Google Discover distribution cannot be guaranteed.
- The public diagnostics script is a lightweight HTTP/HTML check. It is not a browser rendering test or Search Console audit.
- Existing production release blockers are higher priority than commercial feature expansion. The pilot must not block security, tenant provisioning or billing gates.
