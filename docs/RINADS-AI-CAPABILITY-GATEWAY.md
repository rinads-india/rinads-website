# RINADS AI + Capability Gateway

Status: **implementation foundation / external execution disabled**

## Purpose

RINADS must remain the governed business-action layer even when a user enters through RINPO, ChatGPT, Claude, Gemini, Grok or another agent. External models are inference providers or channels; they are not sources of truth and they do not receive direct authority over commerce, logistics, growth, finance or communication systems.

```text
User / Staff / Founder / Customer
        |
RINPO / external AI channel
        |
RINADS Agent Gateway
        |
RINADS Intelligence
        |
Business Graph + authoritative domain services
        |
RINPO Runtime policy / approval / audit
        |
Capability Registry
        |
Shopify / Shiprocket / Delhivery / DTDC / Porter / Meta / Google / ...
```

## Delivered in this slice

### Multi-model AI Gateway

`@rinads/intelligence` now supports server-side provider routes for:

- OpenAI
- Anthropic / Claude
- Google / Gemini
- xAI / Grok
- custom OpenAI-compatible endpoints

The deterministic parser remains the safe fallback. Merely adding a vendor API key must not grant any business-action authority.

Task routing is conservative:

- restricted data -> deterministic/local path only;
- research may prefer xAI only when external research is explicitly allowed;
- coding may prefer Anthropic when configured and permitted;
- vision/translation may prefer Google when configured and permitted;
- explicit provider allowlists override task preferences;
- API keys are excluded from registry/route metadata.

### Provider-neutral model client

`RinpoModelClient` translates a governed inference request into the provider protocol:

- OpenAI/xAI/custom -> OpenAI-compatible chat-completions transport;
- Anthropic -> Messages API;
- Google -> Gemini generateContent transport.

Google credentials use an HTTP header, not a query-string secret. The model client never executes RINADS tools or authorizes an action.

### Canonical Capability Registry

`@rinads/platform` now contains a provider-neutral registry covering the first agentic domains:

- Commerce
- Logistics
- Growth
- Communication
- Intelligence

Each capability declares:

- canonical key;
- domain;
- risk class (`READ`, `DRAFT`, `WRITE`, `ACTION`, `SENSITIVE`);
- external-agent policy (`read_only`, `approval_required`, `blocked`);
- compatible provider families.

Provider presence in this registry means the capability may be implemented by that adapter family. It **does not** mean the tenant has configured credentials or that the provider is live.

### Public discovery endpoint

`GET /api/v1/agent/capabilities`

The endpoint exposes safe static capability metadata only. It deliberately reports `execution.enabled = false` for every capability.

It must never expose:

- tenant data;
- API keys/tokens;
- provider configuration state;
- customer/order PII;
- Runtime approval tokens;
- service-role credentials.

### MCP discovery endpoint

`POST /api/mcp`

The stacked MCP slice exposes the same canonical capability registry as MCP tools while keeping execution fail-closed. It supports:

- modern MCP `2026-07-28` discovery through `server/discover`;
- legacy `2025-11-25` `initialize` discovery for compatibility;
- `tools/list` mapped from canonical RINADS capability keys;
- tool annotations derived from RINADS risk classes;
- no `organization_id` argument in tool schemas;
- `tools/call` returning a governed execution-disabled result until authenticated Agent Gateway execution is bound.

The MCP endpoint is stateless. It does not treat MCP client identity metadata as authorization evidence. Server identity is presentation/diagnostic metadata only.

## External-agent execution contract

External execution is intentionally not activated by this slice.

Before ChatGPT, Claude, Gemini or another remote agent can call a RINADS tool, the request path must provide all of the following:

1. authenticated actor identity;
2. canonical `organization_id` resolved server-side;
3. active membership / role / permission checks;
4. capability entitlement check;
5. tool/capability risk classification;
6. RINADS Intelligence recommendation/authorization policy where applicable;
7. RINPO Runtime approval stage for actions that require approval;
8. idempotency key for external effects;
9. provider execution receipt;
10. append-only audit/business event.

No browser-supplied `organization_id`, role or permission may become an authorization boundary.

## Commerce rule

Shopify is a commerce provider, not the RINADS control plane. RINADS must preserve its own tenant, Business Graph, Runtime and audit boundaries around Shopify operations.

Initial provider mapping:

- product/catalog read -> RINADS / Shopify;
- order read -> RINADS / Shopify;
- cart creation -> approval-gated external agent policy;
- checkout creation -> blocked for unauthenticated external agents.

## Logistics rule

RINADS Shipping remains provider-neutral. Shiprocket and direct carriers such as Delhivery are adapters beneath the RINADS routing/governance layer.

Initial provider mapping covers normalized quote, tracking, shipment creation, cancellation and reverse-logistics intents. Cancellation is blocked for external agents by default.

## Growth rule

Meta, Google and Shiprocket/Fastrr-style acquisition integrations remain beneath RINADS Growth. Drafting is not publishing. Paid campaign launch remains a sensitive action and is blocked from generic external-agent execution until the existing marketing approval and reconciliation controls are bound to the gateway.

## Provider environment variables

Server only; never use `NEXT_PUBLIC_` prefixes.

```text
RINADS_RINPO_LLM_PROVIDER=openai|anthropic|google|xai|custom

RINADS_OPENAI_API_KEY=
RINADS_OPENAI_BASE_URL=https://api.openai.com/v1
RINADS_OPENAI_MODEL=

RINADS_ANTHROPIC_API_KEY=
RINADS_ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
RINADS_ANTHROPIC_MODEL=claude-sonnet-5-5

RINADS_GOOGLE_AI_API_KEY=
RINADS_GOOGLE_AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
RINADS_GOOGLE_AI_MODEL=gemini-3.8-flash

RINADS_XAI_API_KEY=
RINADS_XAI_BASE_URL=https://api.x.ai/v1
RINADS_XAI_MODEL=grok-4.7

# custom uses the existing OpenAI-compatible contract
RINADS_RINPO_LLM_API_KEY=
RINADS_RINPO_LLM_BASE_URL=
RINADS_RINPO_LLM_MODEL=
```

## Next implementation slices

1. authenticated Agent Gateway principal/token model;
2. MCP/OAuth resource-server authorization for external agents;
3. tenant-scoped READ execution through existing service contracts;
4. Shopify adapter binding to canonical commerce commands and read projections;
5. Shiprocket canonical adapter completion after shipment intent is enriched;
6. Shiprocket tracking/webhook normalization into RINADS shipment events;
7. Delhivery production gate after staging evidence and founder approval;
8. Meta/Google campaign adapters bound to existing marketing publication approvals;
9. customer/business graph event normalization across commerce, growth and fulfilment;
10. RINPO Phone UI showing recommendation -> authorization -> action -> receipt.

## Production gate

These slices are source-only. Do not enable external tool execution, add production credentials, activate a carrier, launch ads, apply production database migrations, or promote a production deployment solely because this code is merged. Each external-effect adapter needs its own staging evidence and explicit production authorization.
