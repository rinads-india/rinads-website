# ADR-010 — Design system

- **Status:** Accepted
- **Date:** 2026-08-14

## Context

Brand tokens existed only in website CSS.

## Decision

`packages/brand` holds canonical tokens (primary `#9F4BC7`, white, black, Figtree). `packages/ui` will host shadcn-based components.

## Phase 0 amendment

Brand package created. UI package is a **justified skeleton**; shadcn install deferred.

## Consequences

Apps consume `@rinads/brand`. No arbitrary brand redesign without Founder approval.
