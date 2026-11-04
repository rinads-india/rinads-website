# RINADS Motion Studio — standalone starter

This is a **separate, optional** Remotion video project for the RINADS "Business, simplified." master explainer.

It is intentionally outside the root pnpm workspace; the public Next.js website, production runtime, lockfile, deployment settings and customer data flows are unchanged.

## Install and preview

Requirements: Node.js 20+, supported Chrome/Chromium rendering environment.

```bash
cd tools/remotion
npm install
npm run studio
```

Select `RINADSBusinessSimplifiedLandscape` (1920 × 1080) or `RINADSBusinessSimplifiedVertical` (1080 × 1920). Both are 45 seconds at 30 fps.

## Render

```bash
npm run render:landscape
npm run render:vertical
```

Outputs go in the ignored `out/` folder. No automatic publication occurs.

## Creative and accuracy requirements

- Brand: midnight black, violet/purple, white; tagline **Business, simplified.**
- Product responsibilities: **RINADS INTELLIGENCE understands; RINPO is the interface; RINPO RUNTIME executes under permission, approval and audit.**
- Use the official RINADS monogram and approved RINPO character assets only when asset ownership and version are verified. This starter uses wordmark text and a labelled phone card; it does **not** recreate the locked RINPO character.
- Every demonstration is labelled illustrative or synthetic. No unverified customer figures, testimonials, guarantees, automation claims or payment claims.
- Add approved narration, subtitles and audio in a separate review.
- Obtain commercial licensing approval under Remotion's terms before business/commercial rendering. Remotion packages are pinned to the same exact release.
- Before production: install, render both formats, inspect frames, confirm no clipping, assess contrast and captions, and approve branding.

Do not use Remotion as the website interaction engine. Existing `framer-motion` serves interactive transitions in Next.js; Remotion serves videos.
