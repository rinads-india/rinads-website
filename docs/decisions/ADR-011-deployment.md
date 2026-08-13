# ADR-011 — Deployment architecture

- **Status:** Accepted
- **Date:** 2026-08-14

## Context

Unguarded `vercel deploy --prod` was the primary scripted path.

## Decision

CI-gated workflow: PR → CI → review → merge → staging → verify → production. Direct CLI prod deploy is **EMERGENCY MODE** only.

## Consequences

See `docs/deployment/POLICY.md`. Script renamed to `deploy:emergency`.
