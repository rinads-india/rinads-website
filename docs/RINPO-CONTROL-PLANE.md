# RINPO Production Control Plane

## Purpose

`admin.rinads.com/rinpo` is the private founder/platform-owner control surface for RINPO. It is not a public chat page and it must never substitute demo values for unavailable production sources.

RINPO remains an intelligence layer inside the RINADS platform. Supabase is the operational system of record, the separate RINPO runtime is the execution plane, and every consequential action remains subject to authorization, policy, approval when required, and audit.

## Access boundary

The route is server-gated to the existing `founder` and `super_admin` role keys through `loadPlatformAccess()`.

Non-founder platform-admin users do not receive Founder Intelligence or RINPO Control links in the shared navigation. Direct access to `/rinpo` still fails closed at the route guard.

## Live sources

The first production slice reads only real sources:

- RINPO runtime health from the existing Founder Intelligence runtime adapter.
- RINADS Intelligence/Supabase health from the existing Founder Intelligence Supabase adapter.
- Exact server-side counts from canonical tables:
  - `rinpo_conversations`
  - `rinpo_memory_facts`
  - `rinpo_actions` (`status = pending`)
  - `runtime_approvals` (`status = pending`)
  - `rinpo_audit_log`
  - `rinpo_training_jobs`

If service credentials or a source are unavailable, the UI shows `Not connected`, `Unavailable`, `Degraded`, or `—`. It does not invent a healthy status or usage metric.

## Security rules

1. Service-role credentials are read only in server-only adapters.
2. No service credential is exposed through a `NEXT_PUBLIC_*` variable.
3. The control surface is read-only in this slice.
4. No model output can directly mutate production data.
5. Future write controls must use the existing proposal/approval/runtime/audit path.
6. Tenant and actor authorization remain separate from memory retrieval.
7. External model providers are inference dependencies only; they do not own RINPO identity, tenant state, permissions, memory, or execution policy.

## Canonical request lifecycle

```text
User request
  -> identity
  -> tenant/workspace
  -> authorization
  -> working context
  -> permitted memory retrieval
  -> operational data
  -> RINADS Intelligence provider route
  -> model inference
  -> structured result
  -> optional tool request
  -> policy/risk gate
  -> approval gate when required
  -> deterministic execution
  -> audit event
  -> memory/evaluation update
```

## Environment contract

Existing server-side configuration is reused:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RINPO_RUNTIME_HEALTH_URL`
- `RINPO_RUNTIME_HEALTH_TOKEN` (optional)
- `RINPO_RUNTIME_CONSOLE_URL` (optional)

Founder Intelligence Vercel status remains controlled by its existing Vercel environment variables.

Provider routing is documented in `docs/RINPO-NETWORK-PROVIDERS.md`. Provider keys must remain server-only. The first provider-aware slice supports OpenAI, xAI/Grok, and custom OpenAI-compatible endpoints while preserving the deterministic NLU fallback.

## Next implementation slices

1. Session inspection with actor/tenant context and redacted transcript metadata.
2. Memory provenance, correction, retention and scope controls.
3. Tool registry with explicit permission/risk metadata.
4. Unified action + runtime approval queue.
5. Agent registry, runs, evaluation and cost budgets.
6. Persist provider/model/token/cost/latency observability and show founder-only routing health.
7. Development -> evaluation -> founder approval -> production release governance.
8. Rollback and kill-switch controls with immutable audit events.
9. Task-aware routing (`reasoning`, `research`, `code`, `vision`, `voice`) plus tenant/provider allowlists.

These slices must remain incremental. Do not create a second primary admin application, database, or model-specific business layer.
