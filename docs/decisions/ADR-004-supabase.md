# ADR-004 — Supabase architecture

- **Status:** Accepted
- **Date:** 2026-08-14

## Context

Constitution selects Supabase for Auth, Postgres, Storage, Edge Functions.

## Decision

Supabase is the primary backend. Migrations in-repo under `supabase/`. One project per environment (when connected).

## Phase 0 amendment

Supabase directory exists as a boundary only. **NOT LIVE for production business data.** No tenant/CRM/ERP migrations in Phase 0.

## Consequences

Phase 1 will introduce Auth + identity schema under Founder authorization.
