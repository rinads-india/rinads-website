# RINADS public website — brand/UX refinement

Date: 2026-11-11  
Branch: `fix/brand-logo-ux-20261111`  
Base: `a26653fd4b43435d0409c0ab6d2c55cc74d6566e`  
Scope: visual layer only; no auth, tenancy, schema, billing, Supabase, Runway API, or production changes.

## What changed

1. `Logo.tsx`: The entire lockup is no longer inverted on dark surfaces. The untouched official PNG is the bottom layer; an identically positioned white-wordmark mask is clipped to the text region only. The original purple ribbon R pixels remain unchanged. This is an interim implementation until the founder supplies a verified approved dark master file.
2. `HomeHero.tsx`: A larger, bolder Figtree display headline improves hierarchy without changing approved text or CTAs.
3. `RinpoHeroPreview.tsx`: Enlarged the already-approved RINPO artwork without modifying its appearance or introducing an AI-generated substitute.
4. `Navbar.tsx`: Raised small desktop navigation labels to a more readable size and reduced unnecessary tracking.
5. `globals.css`: Added a semantic Figtree display class; preserved existing app typography, brand tokens and theme behavior. Wrapped footer navigation columns responsively.
6. `Footer.tsx`: Deferred background video initialization until the footer approaches the viewport; pause when out of view. Keep reduced-motion behavior.

## Founder brand review

- [ ] On a black background, R is **purple**, lettering is **white**, image ratio stays 270:89.
- [ ] On a white background, the original PNG remains exactly unchanged.
- [ ] Check logo at 320, 390, 430, 768, 1024, 1440 and 1920px wide.
- [ ] Verify the 31% clip boundary visually at Retina/2x and 3x display scales: no white touching purple R, no purple segment left in letter i.
- [ ] Confirm all approved logo sources remain untouched. Obtain original dark version from authoritative master assets before replacing this interim technique.
- [ ] Use Figtree for product/public UI. Condensed campaign lettering and speculative RINPO wordmarks are not approved as production UI fonts.
- [ ] Preserve the official character, wardrobe, complexion and ribbon R placements.

## Functional acceptance

- [ ] Homepage nav, RINPO demo, book-demo and sign-in clicks still work.
- [ ] Dark/light and initial system-theme switching show correct logo tone.
- [ ] Mobile menu opens, escapes, closes and is keyboard accessible.
- [ ] RINPO example stays labelled **Synthetic demo**; no sample actions execute business writes.
- [ ] Footer video does not fetch or autoplay on initial load when below viewport; pauses out of view.
- [ ] Reduced-motion devices do not start decorative footer video.
- [ ] No horizontal overflow on 320–430px mobile.
- [ ] Visual regression snapshots for home, navbar, footer, and mobile menu.
- [ ] Lighthouse / Web Vitals and accessibility checks against baseline.

## Release blockers outside this branch

The most recent Vercel deployment of `main` (`a26653f`) is ERROR. Build events show:

- Social OS imports `loadTenancyContext` from `@rinads/tenancy`, which is not exported.
- TypeScript complains at `apps/website/app/api/social/connections/callback/route.ts:111`: `organization_id` not accepted in an `audit_logs` insert (inferred `never[]` overload).

These require a separate, security-reviewed application PR. Do **not** bypass them with `any`, `ts-ignore`, build suppression or removing authorization checks. The brand PR can be reviewed now, but cannot be production-approved until the baseline build passes.

## Release rules

1. Run `pnpm --filter @rinads/website lint`, `typecheck`, `test` and `build`, plus root shared-package checks.
2. Resolve baseline Social OS build failures on a separate security-reviewed branch.
3. Obtain a Vercel **preview** of this exact PR commit; review on desktop and real mobile.
4. Founder approves logo, typography, RINPO art and motion.
5. Merge only after required checks pass. Production deployment must be separately verified. Do not publish from this task automatically.
