# Phase 0 — Repository Audit

Date: 2026-09-24  
Scope: `apps/website` public marketing surface (+ linked CMS/auth packages)  
Branch: `cursor/commercial-readiness-rebuild-fd4b`

## Summary

The website already has a mature product IA (`/platform/*`, `/solutions/*`, `/rinpo`, `/services`, `/academy`) and CMS-backed SEO helpers. Commercial gaps are lead capture, pricing/security/customers/about destinations, buyer-language copy, availability labelling, claim safety, and sitemap hygiene.

**Do not break:** `/signup`, `/os`, onboarding, salon booking, service checkout, Supabase auth cookie refresh, CMS revalidate, portal handoffs.

---

## 1. Current routes (apps/website)

### Marketing (indexable intent)

| Path | Status |
|------|--------|
| `/` | Live homepage |
| `/platform`, `/platform/*-os`, intelligence, cloud | Live |
| `/rinpo`, `/rinpo/intelligence|story|voice|phone` | Live |
| `/solutions`, verticals, `/solutions/salon/book` | Live |
| `/services`, service lines, `/services/[slug]`, checkout | Live (dual model) |
| `/academy` + programmes | Live |
| `/resources` | Thin hub |
| `/company`, privacy, terms, cookies | Live — legal is non-binding placeholder |
| `/projects` | Fake submit (setTimeout) |
| `/contact` | **Redirects to `/company#contact`** — P0 fix |

### Missing vs target IA

`/customers`, `/customers/[slug]`, `/pricing`, `/security`, `/integrations`, `/docs`, `/developers/*`, `/about`, `/changelog`, `/careers`, `/status`, `/legal/dpa`, `/legal/subprocessors`

### Auth / app (must stay intact)

`/signup`, `/os`, `/onboarding/*`, `/track/[orderId]`, `/api/health`, `/api/chat`, `/api/revalidate`

### Legacy redirects (next.config)

`/business-os` → business-os · `/cloud` & `/rinads-cloud` → cloud · `/grow` → marketing-os · `/rinpo-intelligence` → intelligence · `/rinpo-story` → `/rinpo/story`

### Risk surfaces

- `/story-concept` rewrite + sitemap entry with fake enterprise logos/metrics  
- Dual `/services` static lines vs Supabase catalog `[slug]`  
- Sitemap includes `/contact` (redirect) and `/story-concept`

---

## 2. Navigation

Source: `lib/product-ia.ts` → `Navbar` / `DynamicIslandNav` / `Footer`

Current: Platform · Solutions · RINPO · Services · Academy · Resources  
CTAs: “Talk to RINPO” · “Start with RINADS”

Target: Product · Solutions · Customers · Pricing · Resources · Services · Academy  
Utility: Book a demo · Sign in  
Company in footer; RINPO inside Product + contextual CTAs

---

## 3. Components map

| Area | Paths |
|------|-------|
| Chrome | `components/rinads/*` |
| Home | `components/home/*` |
| System shells | `components/system/*` |
| RINPO | `components/rinpo/*`, `hooks/useRinpo*` |
| Projects | `components/projects/ProjectsLanding.tsx` |
| OS preview | `components/os/*` |
| Content | `lib/content/*`, `lib/product-ia.ts` |
| CMS | `lib/cms.ts`, `@rinads/cms` |

Reusable gaps vs brief: `ProductStatus`, route registry, pricing/security/customers cards, lead form, JSON-LD helpers beyond home.

---

## 4. Auth / Supabase / env

- Auth: `demo` \| `supabase` via `@rinads/auth` + `AuthContext`  
- Middleware: production env contract → CMS redirects → session refresh  
- Portals: `NEXT_PUBLIC_*_PORTAL_URL`, `NEXT_PUBLIC_RINAGLOW_URL`  
- Site URL: `NEXT_PUBLIC_SITE_URL` for metadata/sitemap  
- Risk: do not change auth cookie domain or env contract behaviour

---

## 5. Forms

| Form | Backend |
|------|---------|
| Projects | **None** (fake success) |
| Company contact | RINPO open / link to projects |
| Footer email | Opens RINPO chat |
| Signup / onboarding / salon / checkout | Real (Supabase / billing / salon-server) |

---

## 6. Analytics

None. Need stable event API without sending secrets/prompts.

---

## 7. SEO / metadata

- Per-page: `getPageMetadata` + CMS `DEFAULT_SEO`  
- Sitemap: static + CMS published paths  
- Robots: disallow `/os`, checkout, track, rinaglow  
- Gaps: no central route registry; contact/story-concept pollution; incomplete noindex for auth/onboarding

---

## 8. RINPO

Globally mounted via `RinpoProvider`. Public chat is rule-based (`/api/chat`). Demo must stay distinct from authenticated execution.

---

## 9. P0 content risks

1. Legal non-binding banners (`LegalPage` + privacy/terms/cookies)  
2. `/story-concept` fake trust + sitemap  
3. `OsSystemStatus` 99.9% / “all systems operational”  
4. Engineering language on Platform / Cloud / Phone / Intelligence / solutions  
5. Homepage authoring “should” copy  
6. Unverified 75% / GST-compliant / live ROI claims in RINPO surfaces  
7. Vertical `available` labels without production readiness alignment  

---

## 10. Database / API risk for Phase 1+

Safe: marketing pages, content modules, sitemap, robots, analytics stub, UI components  
Caution: contact/projects persistence (new table or external webhook; avoid blocking on DB if unset)  
Do not touch: auth middleware contract, salon booking, checkout, onboarding provision

---

## Phase gate

Phase 0 complete when this audit is committed. Phase 1 starts with P0 cleanup + foundations listed in the commercial-readiness brief.
