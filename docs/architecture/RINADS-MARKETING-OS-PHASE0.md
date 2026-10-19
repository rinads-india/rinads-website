# RINADS Marketing OS — Phase 0 Contract

Status: implementation foundation. This phase intentionally creates no external social-media side effects.

## Product boundary

Marketing OS is a RINADS core execution layer, not a Metricool dependency or a standalone scheduler clone.

The operating loop is:

`UNDERSTAND → PLAN → CREATE → APPROVE → PUBLISH → MEASURE → LEARN → OPTIMIZE`

RINADS Intelligence reasons over business context. RINPO Runtime remains the governed action/memory layer. Marketing OS owns marketing domain records and channel execution contracts. Canonical `business_events` remains the event bus.

## Canonical tenancy

- `organizations` is the tenant boundary.
- Every tenant-sensitive Marketing OS row carries `organization_id`.
- Cross-record relationships use same-organization composite foreign keys where applicable.
- RLS uses the existing `private.has_permission(...)` helper.
- Shared physical/virtual sites reuse `public.locations`; Marketing OS must not create another location table.

## Business DNA

Phase 0 introduces:

- `business_profiles`
- `brand_profiles`
- `business_goals`

These are organization-level context extensions used by future RINADS Intelligence recommendations, content generation, attribution, and vertical packs.

## Campaign/content model

A campaign can own many canonical content items. A content item can own many channel variants and media assets. Publications are per-channel executions and use an explicit lifecycle rather than a `published` boolean:

`DRAFT → GENERATING → REVIEW → APPROVED → SCHEDULED → PROCESSING → PUBLISHED`

Failure/terminal states: `PARTIAL_FAILURE`, `FAILED`, `ARCHIVED`.

`marketing_publications` requires an organization-scoped idempotency key so retries cannot silently create duplicate channel actions.

## Channel Gateway

The TypeScript boundary lives under `packages/platform/src/marketing` for Phase 0 to avoid introducing a new workspace package/lockfile edge before the API stabilizes.

`SocialChannelAdapter` defines:

- connect
- refreshCredentials
- publish
- schedule
- deletePost
- getPost
- getMetrics
- getAccountMetrics
- getComments
- reply
- healthCheck

`ChannelGateway` registers provider adapters and refuses unsupported capabilities.

When the contract stabilizes, this module can be extracted to `@rinads/marketing` without changing consumers.

## Meta adapter safety gate

`MetaChannelAdapter` is present but fail-closed. In Phase 0 its only enabled capability is local connection-health validation.

It does **not** call Meta Graph APIs and it does **not** store raw access/refresh tokens. `channel_connections.credential_ref` is only a handle to a future server-side credential store.

External effects stay blocked until all of the following exist:

1. reviewed OAuth callback + state/PKCE handling;
2. encrypted/server-only credential resolver;
3. Graph API transport with version pinning;
4. account/page discovery and Instagram professional-account mapping;
5. retry/rate-limit/idempotency worker;
6. Runtime approval bridge for public/financial actions;
7. audit/event emission and integration tests.

## Approval levels

Marketing OS reserves a 0–4 risk scale:

- `0` read-only analysis;
- `1` draft/no external effect;
- `2` low-risk execution, tenant policy controlled;
- `3` public or financial action, human approval required;
- `4` high-impact configuration/budget action, founder/admin control.

Phase 0 stores the requested approval level on content/publication records. Runtime remains the canonical approval engine; a later phase will bind execution to `runtime_approvals` rather than create a competing approval system.

## Stable events

Marketing code should emit through Runtime `business_events` using stable names from `MARKETING_OS_EVENTS`, including:

- `marketing.content.created`
- `marketing.content.approved`
- `marketing.publication.scheduled`
- `marketing.publication.published`
- `marketing.publication.failed`
- `marketing.metric.updated`
- `rinpo.recommendation.created`
- `rinpo.action.requested`
- `rinpo.action.approved`
- `rinpo.action.executed`

## Next milestone — Phase 0.1

Wire Meta read-only OAuth/account discovery first, then publishing behind explicit Runtime approval. Do not enable ad-spend mutation in the first connector release.
