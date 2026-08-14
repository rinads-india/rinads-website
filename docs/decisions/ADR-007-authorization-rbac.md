# ADR-007 — Authorization / RBAC

- **Status:** Accepted
- **Date:** 2026-08-14

## Context

UI role labels are not security.

## Decision

Permission-based RBAC evaluated in database (RLS helpers) and application services. UI hiding is never sufficient.

## Phase 0 amendment

`packages/permissions` defines foundational types only. Full RBAC/RLS is Phase 1+.

## Consequences

Documented rule: **CLIENT UI CHECKS ARE NOT AUTHORIZATION.**
