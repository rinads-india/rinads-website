# RINADS UX V2 — PR-05 Platform Core

## Objective

Rebuild the three platform-core public routes so they explain the RINADS architecture as a coherent operating platform rather than reusing the generic Operating System marketing-page template.

Routes:

- `/platform`
- `/platform/rinads-intelligence`
- `/platform/rinads-cloud`

## Canonical public architecture

```text
RINADS Experience
      ↓
RINPO
      ↓
RINADS Intelligence
      ↓
Operating System Suite
      ↓
RINADS Cloud
```

RINADS Services remains implementation/delivery capability around the platform and is not presented as a technical runtime layer.

## /platform

The platform page now covers:

- five-layer platform architecture
- connected business lifecycle
- persistent RINPO interaction model
- exactly eight Operating Systems
- industry configuration model
- RINADS Cloud foundation
- platform governance

The page deliberately distinguishes:

- Operating Systems
- platform core
- vertical configurations
- Services

## /platform/rinads-intelligence

RINADS Intelligence now has a dedicated experience instead of the generic `OsMarketingPage`.

The public flow is:

```text
Observe
  ↓
Understand
  ↓
Recommend
  ↓
Authorize
  ↓
Act
  ↓
Audit
```

### Tool model

The page reflects the implemented intelligence registry categories:

- READ
- DRAFT
- ACTION

The page also reflects current hard boundaries documented by the repository:

- no silent confirmation bypass
- no RINPO payment submission authority
- inventory adjustment uses proposal + explicit confirmation
- owner tools require the relevant owner/ops context

The public website does not claim that its rule-based chat is equivalent to the full product-side RINPO tool path.

## /platform/rinads-cloud

RINADS Cloud now has a dedicated experience organized around:

- Applications
- Identity + tenant context
- Domain services
- Runtime
- Data + storage
- Infrastructure

The page describes the existing monorepo/application/package architecture rather than presenting a generic cloud-feature list.

### Runtime

The page reflects repository-backed concepts:

- business events
- workflow executions and step runs
- approval-aware workflow states
- notification outbox
- retry/worker architecture

### Security/trust

The page intentionally uses implementation-grounded language:

- tenant-scoped RLS/security patterns
- authorization boundaries
- workflow approval gates
- event/audit/runtime primitives

It does not claim external certification or compliance status.

## Model-provider boundary

The Cloud page does **not** claim that a full RINADS AI Gateway is already implemented.

Instead it documents the architectural boundary:

```text
RINPO / product request
        ↓
RINADS Intelligence
        ↓
model / inference adapter
        ↓
registered tool / runtime
```

This preserves the long-term provider-independent architecture without misrepresenting current implementation status.

## Current limitations exposed honestly

The Cloud page states that:

- some provider adapters still need credentials or production integration
- website RINPO remains distinct from product-side intelligence execution
- some runtime workflow definitions are still built-in code paths rather than fully database-loaded definitions
- production claims should follow implemented code + deployment state

## Non-goals

- no individual Operating System redesign
- no database change
- no auth/tenancy/RLS change
- no runtime behaviour change
- no LLM provider migration
- no new AI gateway implementation
- no new infrastructure provider
- no compliance/certification claim
- no Services or Academy redesign

## Tests

PR-05 adds tests that lock:

- exactly eight Operating Systems
- Intelligence and Cloud as core layers
- dedicated Intelligence/Cloud route clients
- no fallback to generic `OsMarketingPage`
- model-provider language that does not falsely claim an implemented AI gateway

## Follow-up

PR-06 should redesign the eight Operating System pages with shared structure but unique product demonstrations:

- Business OS — Founder Command Center
- Commerce OS — Product → order → fulfilment
- Marketing OS — Campaign Command Center
- Logistics OS — Control Tower
- Creative OS — AI Production Studio
- Build OS — Software Factory
- Academy OS — Skill Graph + RINPO Tutor
- Automation OS — Workflow + Approval + Audit
