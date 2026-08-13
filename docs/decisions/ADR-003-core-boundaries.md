# ADR-003 — RINADS CORE boundaries

- **Status:** Accepted
- **Date:** 2026-08-14

## Context

Risk of stuffing vertical business modules into CORE or into the website.

## Decision

CORE reusable code lives in `packages/*` (auth, permissions, database client boundary, shared, brand, ui). **PostgreSQL schema and migrations live only under `supabase/`.** Vertical business data does not automatically live in packages.

## Consequences

Clear separation: code packages vs database. Phase 0 creates package boundaries without business schema.
