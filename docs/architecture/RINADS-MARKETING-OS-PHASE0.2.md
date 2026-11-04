# RINADS Marketing OS — Phase 0.2 Governed Publishing Control Plane

## Status

Phase 0.2 introduces the **control plane for future social publishing**. It does not enable Meta or any other provider write transport.

The governing rule is:

> No external marketing write executes without tenant authorization, an exact-payload human approval, an idempotent publication record, and a durable attempt trail.

## Canonical architecture

Phase 0.2 reuses existing platform primitives rather than creating parallel systems:

- tenant boundary: `organizations`
- permissions: `marketing.publish`, `org.manage`
- human-in-the-loop authority: canonical `runtime_approvals`
- event log: canonical append-only `business_events`
- execution state: `marketing_publications` + `marketing_publication_attempts`
- channel abstraction: `ChannelGateway` / provider transports

`runtime_approvals.resource_type/resource_id` bind a Runtime approval to the publication. The approval stores a SHA-256 fingerprint of the externally meaningful publication payload. Creative, media, target account, variant, or publication metadata changes invalidate the approval.

## State transitions

Authenticated publishers can create DRAFT publication records and edit authoring-only fields. They cannot directly mutate publication execution state.

Governed transitions are:

1. DRAFT / REVIEW / FAILED → `request_marketing_publication_approval()` → REVIEW
2. REVIEW → `resolve_marketing_publication_approval(..., approved)` → APPROVED
3. APPROVED → `schedule_marketing_publication()` → SCHEDULED
4. SCHEDULED → service-role `claim_marketing_publications()` → PROCESSING
5. PROCESSING → `begin_marketing_publication_dispatch()` immediately before provider I/O
6. PROCESSING → `complete_marketing_publication_dispatch()` → PUBLISHED
7. PROCESSING → failure before provider I/O → FAILED
8. PROCESSING → ambiguous failure after provider I/O begins → PARTIAL_FAILURE

A rejected approval returns the publication to DRAFT. An approval request expires after 24 hours if it remains pending. Once approved, authority remains valid until the approved payload changes.

## Duplicate-post safety

The publication idempotency key is stable and unique per organization, but provider APIs do not all guarantee idempotent post creation. Phase 0.2 therefore uses a two-phase dispatch record:

- `not_started`: no provider request has begun; retry can be safe.
- `unknown`: provider dispatch began and the outcome is uncertain; **never automatically retry**.
- `sent`: provider success was confirmed.

The worker persists `unknown` immediately before external I/O. A crash or connection error after that point moves the publication to `PARTIAL_FAILURE` for reconciliation instead of risking a duplicate post.

Stale PROCESSING recovery follows the same rule: work abandoned before dispatch is safely requeued; work abandoned after dispatch begins is quarantined as `PARTIAL_FAILURE`.

## Worker contract

`runMarketingPublicationWorker()` is provider-neutral and is disabled unless `externalEffectsEnabled` is explicitly true. When disabled, it does not even claim work.

Even when enabled, Phase 0.2 ships no Meta write transport. A later release must separately add and review provider-specific publishing capability, permissions/scopes, credential handling, media upload semantics, rate limits, idempotency/reconciliation behavior, and production rollout controls.

## Current production gate

This migration is intentionally committed but **must remain unapplied until the canonical Supabase project backing the RINADS platform schema is positively identified**. The currently connected `rinads-one-dev` project does not contain the canonical `organizations` / Runtime / Marketing OS schema and is not a valid target for this migration.

Phase 0.2 code can be merged independently because external effects remain fail-closed. Applying the migration and enabling provider writes are separate founder-controlled gates.

## Phase 0.3 gate before real Meta publishing

Required before a first real post:

1. Canonical production Supabase project identified and migration chain validated.
2. Phase 0, 0.1 and 0.2 migrations applied in order; security/performance advisors reviewed.
3. Meta app production credentials and reviewed write scopes configured.
4. Provider-specific transport implements Facebook/Instagram publishing without leaking credentials.
5. Reconciliation path can query a provider after `PARTIAL_FAILURE` before any retry.
6. Test tenant performs approved dry runs and limited live canary posts.
7. RINPO can propose content but cannot bypass Runtime approval.
8. Production external-effects enablement is explicit and reversible.
