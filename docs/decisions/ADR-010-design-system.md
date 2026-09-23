# ADR-010 — Design system

- **Status:** Accepted
- **Date:** 2026-08-14
- **Amended:** 2026-09-23

## Context

Brand tokens originally existed only in website CSS. RINADS now spans the Public Experience, commerce, ERP, R GLOW, platform administration, and RINPO surfaces, so page-local styling cannot be the source of truth.

## Decision

`packages/brand` is the canonical design-token package.

Locked brand primitives remain:

- Primary purple: `#9F4BC7`
- White: `#FFFFFF`
- Black: `#000000`
- Typeface: Figtree

`packages/ui` remains the shared primitive component package.

## Phase 0 amendment

Brand package created. UI package is a **justified skeleton**; shadcn install deferred.

## UX V2 amendment

Add semantic foundations to `@rinads/brand` without replacing the locked primitives:

- light/dark surfaces and text roles
- interaction and focus roles
- success/warning/critical/info status roles
- spacing
- radii
- shadows
- motion
- minimum interaction target guidance
- standard QA viewport checks

Public-experience pages should migrate toward semantic intent rather than introduce arbitrary page-local values.

The migration is additive. Existing operational applications must not experience visual drift solely because UX V2 is being introduced.

## Consequences

- Apps consume `@rinads/brand` as the source of truth.
- No arbitrary brand redesign without Founder approval.
- RINADS purple should communicate intelligence, interaction, active state, or selected state rather than decorate every surface.
- Status meaning is expressed through semantic status tokens rather than ad-hoc red/green/amber classes.
- Motion should communicate state or causality and respect reduced-motion preferences.
- Route redesigns remain separate PRs from foundational token changes.
