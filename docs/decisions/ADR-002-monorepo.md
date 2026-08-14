# ADR-002 — Monorepo

- **Status:** Accepted
- **Date:** 2026-08-14

## Context

Multiple apps will share auth, permissions, UI, and types.

## Decision

Use a **pnpm workspaces + Turborepo** monorepo (`apps/*`, `packages/*`, `supabase/`, `docs/`). Do not use npm workspaces, Yarn, or Nx.

## Consequences

Website moves to `apps/website`. Shared packages are workspace dependencies. Vercel root directory must point at the app.
