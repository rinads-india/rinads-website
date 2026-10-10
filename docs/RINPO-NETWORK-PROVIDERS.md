# RINPO Network — Intelligence Provider Routing

## Purpose

RINPO is the user-facing intelligence identity and governed execution interface. External model providers are interchangeable inference dependencies behind the RINADS Intelligence boundary; they do not own tenant identity, permissions, memory, approvals, or business execution.

Canonical path:

```text
User / Staff / Founder
  -> RINPO
  -> identity + tenant/workspace
  -> permissions + policy
  -> permitted memory/context
  -> RINADS Intelligence task + data-sensitivity routing
  -> approved model provider
  -> structured RINPO intent/result
  -> tool policy/risk gate
  -> approval when required
  -> deterministic execution
  -> audit + observability
```

## Implemented slices

`@rinads/intelligence` now contains two incremental RINPO Network layers:

1. provider-aware OpenAI-compatible route resolution;
2. a safe model registry + conservative task-aware selection policy.

Supported provider IDs:

- `openai`
- `xai`
- `custom` (OpenAI-compatible endpoint)

Supported task classes in the registry contract:

- `nlu`
- `research`
- `reasoning`
- `code`
- `vision`
- `voice`
- `translation`

Supported data-sensitivity classes:

- `public`
- `internal`
- `confidential`
- `restricted`

This is still not a general autonomous multi-model agent framework. It is a governed selection seam: the registry describes configured routes and the task router chooses only among providers already permitted by policy.

## xAI / Grok

Default xAI route:

- Base URL: `https://api.x.ai/v1`
- Model: `grok-4.7`
- Transport in the current NLU slice: OpenAI-compatible `/chat/completions`

The xAI provider is used only for inference. All RINPO tool authorization and approval behavior stays in the existing RINADS packages.

### Server-side configuration

Preferred:

```bash
RINADS_RINPO_LLM_PROVIDER=xai
RINADS_XAI_API_KEY=<server-only xAI key>
RINADS_XAI_MODEL=grok-4.7
# Optional override only when required:
# RINADS_XAI_BASE_URL=https://api.x.ai/v1
```

Never prefix provider secrets with `NEXT_PUBLIC_`.

Existing deployments remain compatible with:

```bash
RINADS_RINPO_LLM_API_KEY=<key>
RINADS_RINPO_LLM_BASE_URL=<OpenAI-compatible base URL>
RINADS_RINPO_LLM_MODEL=<model>
```

The legacy single key is scoped only to the selected provider. Registry discovery must not present that one credential as if it configured every provider.

If no explicit provider and no legacy RINPO key are configured, deterministic NLU remains the default. An unrelated generic model-provider key must not silently enable LLM NLU.

## OpenAI route

```bash
RINADS_RINPO_LLM_PROVIDER=openai
RINADS_OPENAI_API_KEY=<server-only key>
RINADS_OPENAI_MODEL=<approved model id>
# Optional:
# RINADS_OPENAI_BASE_URL=https://api.openai.com/v1
```

## Custom OpenAI-compatible route

```bash
RINADS_RINPO_LLM_PROVIDER=custom
RINADS_RINPO_LLM_API_KEY=<server-only key>
RINADS_RINPO_LLM_BASE_URL=https://provider.example/v1
RINADS_RINPO_LLM_MODEL=<model id>
```

A custom route is not considered configured unless key, base URL, and model are all present.

## Model registry

`listRinpoModelRegistry()` returns safe route metadata for founder/admin diagnostics:

- provider;
- model;
- base URL;
- configured/not-configured state;
- whether the provider is the default selection.

API keys are never returned.

## Task-aware routing policy

`selectRinpoModel(task, sensitivity, policy)` applies conservative routing rules before inference:

1. `restricted` data stays on the deterministic/local path by default;
2. tenant/workspace provider allowlists are applied before preferences;
3. a preferred provider is used only when configured and allowed;
4. `research` may prefer xAI only when `allowExternalResearch` is explicitly true;
5. if the selected provider is unavailable/disallowed, a configured permitted fallback can be selected;
6. if no permitted model route is available, RINPO returns to deterministic handling.

This selection does not itself enable web or X search. External-search tools must be added separately behind RINPO authorization, policy, budget and audit controls.

## Security invariants

1. Model-provider keys are server-only.
2. Providers never receive unrestricted service-role database access.
3. RINPO sends only the context needed for the current governed request.
4. Tenant/actor authorization happens before model routing.
5. Model output cannot directly mutate production state.
6. Sensitive actions remain approval-gated through the existing RINPO action/runtime path.
7. Deterministic fallback remains available when provider inference fails or policy rejects external routing.
8. Provider metadata exposed to admin/observability surfaces must never contain API keys.
9. Restricted data does not route to external model providers by default.

## Why Grok belongs behind RINPO

Use xAI where its capabilities are valuable, especially external/current intelligence and future X/web-enabled research flows. Do not couple RINPO identity, memory, tenant state, permissions, or workflow semantics to Grok.

The intended topology is:

```text
RINPO Runtime / RINADS Intelligence
  -> task + sensitivity classifier
  -> policy + provider allowlist
  -> model registry/router
      -> OpenAI
      -> xAI / Grok
      -> other approved providers
      -> RINADS-hosted models
  -> tools / workflows
  -> audit / evaluation / cost controls
```

## Next slices

1. Persist provider/model/latency/token/cost metadata per model call.
2. Add founder-only provider health and routing visibility in `admin.rinads.com/rinpo`.
3. Add explicit per-tenant routing policies rather than caller-only policy objects.
4. Add external-search tools behind RINPO policy rather than enabling unrestricted provider browsing.
5. Add per-tenant RI credit accounting and hard/soft budgets.
6. Add evaluation gates, fallback scoring and release governance before autonomous production use.

Do not implement these by creating a second admin app or a second source of truth.
