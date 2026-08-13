# ADR-012 — Environment strategy

- **Status:** Accepted
- **Date:** 2026-08-14

## Context

No env contract existed.

## Decision

Explicit development / staging / production. `.env.example` documents public vars. Service role is server-only and never in client bundles.

## Consequences

Phase 0 ships `.env.example` without secrets. Supabase vars reserved for Phase 1+.
