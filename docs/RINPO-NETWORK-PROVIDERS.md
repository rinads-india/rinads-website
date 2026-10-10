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
  -> RINADS Intelligence provider route
  -> model inference
  -> structured RINPO intent/result
  -> tool policy/risk gate
  -> approval when required
  -> deterministic execution
  -> audit + observability
```

## First production slice

`@rinads/intelligence` now exposes a provider-aware OpenAI-compatible route resolver.

Supported provider IDs in this slice:

- `openai`
- `xai`
- `custom` (OpenAI-compatible endpoint)

This is not a general multi-model agent framework yet. It is the minimum provider seam required to add Grok without creating model-specific business logic.

## xAI / Grok

Default xAI route:

- Base URL: `https://api.x.ai/v1`
- Model: `grok-4.7`
- Transport in this slice: OpenAI-compatible `/chat/completions`

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

## Security invariants

1. Model-provider keys are server-only.
2. Providers never receive unrestricted service-role database access.
3. RINPO sends only the context needed for the current governed request.
4. Tenant/actor authorization happens before model routing.
5. Model output cannot directly mutate production state.
6. Sensitive actions remain approval-gated through the existing RINPO action/runtime path.
7. Deterministic fallback remains available when provider inference fails.
8. Provider metadata exposed to admin/observability surfaces must never contain API keys.

## Why Grok belongs behind RINPO

Use xAI where its capabilities are valuable, especially external/current intelligence and future X/web-enabled research flows. Do not couple RINPO identity, memory, tenant state, permissions, or workflow semantics to Grok.

The intended future topology is:

```text
RINPO Runtime / RINADS Intelligence
  -> policy + router
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
3. Introduce task classes (`reasoning`, `research`, `code`, `vision`, `voice`) instead of a single NLU route.
4. Add tenant/provider allowlists and data-sensitivity policies.
5. Add external-search tools behind RINPO policy rather than enabling unrestricted provider browsing.
6. Add per-tenant RI credit accounting and hard/soft budgets.
7. Add evaluation gates and provider fallback policies before autonomous production use.

Do not implement these by creating a second admin app or a second source of truth.
