# ADR-005 — Multi-tenancy

- **Status:** Accepted
- **Date:** 2026-08-14

## Context

RINADS is multi-tenant SaaS. Current website has no orgs/RLS.

## Decision

Organization-centric tenancy. Tenant-sensitive rows carry `organization_id`. RLS enforces membership. Shared-database, shared-schema isolation.

## Consequences

No tenant business data ships before org model + RLS (Phase 1+).
