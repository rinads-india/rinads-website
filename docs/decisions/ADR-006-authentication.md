# ADR-006 — Authentication

- **Status:** Accepted
- **Date:** 2026-08-14

## Context

Phase 0 audit found plaintext localStorage passwords and spoofable privileged roles (P0).

## Decision

Production auth will be **Supabase Auth** (Phase 1+). Privileged roles are never self-serve from public signup.

## Phase 0 amendment

Demo auth is **quarantined**: no password persistence; wipe `rinads_users`; DEMO MODE UX; roles limited to client/staff/admin. This is **not** production authentication.

## Consequences

Do not migrate plaintext users. Do not hash locally as a fake fix.
