# ADR-009 — AI tool architecture

- **Status:** Accepted
- **Date:** 2026-08-14

## Context

AI must not become the source of truth or bypass permissions.

## Decision

AI is advisory by default. Narrow tools. Pipeline: READ → ANALYZE → RECOMMEND → APPROVAL → EXECUTE. Audit invocations.

## Phase 0 amendment

No AI gateway, no LLM introduction, no autonomous tools. Chat remains rule-based with input validation/rate limiting.

## Consequences

Keyword chat is not Intelligence architecture.
