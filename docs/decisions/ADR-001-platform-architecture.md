# ADR-001 — RINADS platform architecture

- **Status:** Accepted
- **Date:** 2026-08-14

## Context

`rinads-website` is a Public Experience app. Growing it into an ERP monolith creates architectural debt.

## Decision

Build RINADS as a layered platform: CORE → shared services → Intelligence → RINPO → verticals → client experiences. Public Experience remains a separate app.

## Consequences

New capabilities are evaluated for CORE vs app. Marketing routes do not host ERP/CRM data models.
