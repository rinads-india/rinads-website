# RINADS UX V2 — PR-02 Global Experience Shell

## Objective

Refactor the public RINADS navigation shell so the information architecture reflects the product hierarchy:

1. Platform
2. Solutions
3. RINPO
4. Services
5. Academy
6. Resources

Company remains available through Resources and the footer instead of occupying equal primary-navigation weight.

## Desktop navigation

The desktop shell now prioritizes:

- Platform
- Solutions
- RINPO
- Services
- Academy
- Resources
- Sign in / Open RINADS
- Start with RINADS
- Theme

### Platform mega menu

Platform is grouped by user intent:

- **Run** — Business OS, Commerce OS
- **Grow** — Marketing OS, Creative OS
- **Operate** — Logistics OS, Automation OS
- **Build & learn** — Build OS, Academy OS
- **Core** — RINADS Intelligence, RINADS Cloud

### Solutions mega menu

Solution labels and availability are sourced from the existing public product reality:

- **Available** — Retail, Landscape & Nursery, Salon / R GLOW
- **Coming soon** — Jewellery, Logistics, Healthcare

No route is renamed in this PR. `/solutions/nursery` remains canonical while the UI label becomes **Landscape & Nursery**.

## Mobile navigation

The previous full-screen list used oversized nested links and became difficult to scan as the product surface expanded.

The UX V2 mobile shell now:

- groups each primary area into a compact card
- provides an explicit overview link
- uses touch-safe nested links
- preserves product availability labels
- places account/start actions in a dedicated conversion block
- keeps Talk to RINPO available without making it the only navigation path

## Semantic theme bridge

The website CSS now maps the UX V2 semantic roles defined by `@rinads/brand`:

- primary/secondary/muted text
- border/border-strong
- interactive/focus
- success/warning/critical/info

This is an incremental bridge until a later PR removes legacy page-local style values.

## Footer

The secondary footer navigation is now labelled **Explore**, with Company retained there. The authenticated product entry is labelled **Open RINADS** rather than **Business OS App**.

## Non-goals

- no homepage redesign
- no persistent RINPO state-machine redesign
- no Operating System page redesign
- no Project Intake rewrite
- no URL migration
- no backend, auth, Supabase, tenancy, RLS, permissions, runtime, or billing change
- no new dependency

## Acceptance criteria

- primary navigation order matches UX V2
- Company is not a top-level desktop/mobile primary group
- platform and solutions mega menus remain keyboard-accessible
- mobile navigation remains usable at 320–430px
- existing public routes are preserved
- current Available / Coming soon solution status remains truthful
- authenticated users retain direct access to `/os`
- unauthenticated users retain sign-in and signup actions
- RINPO remains accessible
- no operational application receives a visual migration from this PR
