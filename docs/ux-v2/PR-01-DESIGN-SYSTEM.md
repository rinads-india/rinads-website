# RINADS UX V2 — PR-01 Design System Foundation

## Objective

Create an additive semantic design foundation for the RINADS public experience without redesigning the locked RINADS identity or changing product behaviour.

This PR is intentionally foundational. It does **not** redesign the homepage, navigation, RINPO, Operating System pages, Services, Academy, or Project Intake.

## Canonical rules

1. The approved RINADS purple remains `#9F4BC7`.
2. Figtree remains the canonical typeface.
3. The existing RINADS logo and RINPO character are locked assets.
4. Purple communicates intelligence, interaction, selected state, or RINPO/AI context. It should not be applied decoratively to every surface.
5. Product state uses semantic status tokens: success, warning, critical, and info.
6. Meaningful interactive targets should target at least 44px.
7. Motion must communicate state or causality and must respect reduced-motion preferences.
8. Existing product apps must not experience visual drift merely because the public website adopts UX V2.

## Added foundation

`@rinads/brand` now exposes:

- `semanticColors`
- `statusColors`
- `spacing`
- `radii`
- `shadows`
- `motion`
- `interaction`
- `viewportChecks`

These are additive to the existing locked primitives in `tokens.ts`.

## Adoption sequence

### PR-02 — Global shell

Map the public website CSS variables and navigation shell to the semantic token contract.

### PR-03 — RINPO interaction shell

Use semantic surface, border, motion, focus, and status tokens in the persistent RINPO UI.

### PR-04+ — Page migrations

Migrate shared public-experience components before route-local styling. Avoid one-off values unless a component has a documented exception.

## Non-goals

- No change to Supabase, tenancy, RLS, auth, audit, or runtime behaviour.
- No replacement of `@rinads/ui` across operational applications.
- No mass visual rewrite of R GLOW, Storefront, Owner Portal, Customer Portal, or Platform Admin.
- No new vendor or UI framework dependency.
- No invented security, compliance, customer, or performance claims.

## Acceptance criteria

- `@rinads/brand` remains backward compatible.
- Existing exports `colors`, `RinadsColorToken`, `typography`, and `brand` remain available.
- New semantic tokens are typed `as const`.
- No runtime dependency is added.
- No existing route or application behaviour changes.
