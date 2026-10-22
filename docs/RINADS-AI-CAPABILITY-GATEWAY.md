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

## Delivered foundation

### Multi-model AI Gateway

`@rinads/intelligence` supports server-side provider routes for:

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

`@rinads/platform` contains a provider-neutral registry covering the first agentic domains:

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

It must never expose tenant data, API keys/tokens, provider configuration state, customer/order PII, Runtime approval tokens or service-role credentials.

### MCP discovery endpoint

`POST /api/mcp`

The MCP layer exposes the canonical capability registry as tools while keeping execution fail-closed. It supports:

- modern MCP `2026-07-28` discovery through `server/discover`;
- legacy `2025-11-25` `initialize` discovery for compatibility;
- `tools/list` mapped from canonical RINADS capability keys;
- tool annotations derived from RINADS risk classes;
- no `organization_id` argument in tool schemas;
- stateless JSON-RPC handling.

MCP client identity metadata is presentation/diagnostic data only and is never treated as authorization evidence.

### Authenticated Agent Principal

The Agent Gateway now reuses the existing RINADS Supabase identity and tenancy model rather than creating a parallel account or tenant system.

First-party/session requests:

1. validate the existing Supabase user session;
2. load active `organization_members`, role and permission evidence;
3. reuse the existing active-organization cookie only when it matches an active membership;
4. resolve organization scope server-side.

Bearer requests:

1. parse `Authorization: Bearer <token>`;
2. validate the access token through Supabase `auth.getUser(token)`;
3. load active RINADS memberships server-side;
4. resolve automatically only when exactly one active organization exists;
5. fail closed with `AGENT_ORGANIZATION_SCOPE_REQUIRED` when the identity belongs to multiple active organizations.

A bearer client cannot choose an organization through a tool argument, custom header or request payload. Multi-organization remote agents require a future RINADS organization-bound delegation/OAuth token.

Even after actor and organization scope resolve, `tools/call` remains disabled with `CAPABILITY_EXECUTION_NOT_ENABLED`. Authentication is necessary but is not authorization to perform business actions.

## External-agent execution contract

Before ChatGPT, Claude, Gemini or another remote agent can execute a RINADS capability, the request path must provide all of the following:

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

No browser/client-supplied `organization_id`, role or permission may become an authorization boundary.

## Commerce rule

Shopify is a commerce provider, not the RINADS control plane. RINADS must preserve its own tenant, Business Graph, Runtime and audit boundaries around Shopify operations.

Initial provider mapping:

- product/catalog read -> RINADS / Shopify;
- order read -> RINADS / Shopify;
- cart creation -> approval-gated external agent policy;
- checkout creation -> blocked for generic external agents.

## Logistics rule

RINADS Shipping remains provider-neutral. Shiprocket and direct carriers such as Delhivery are adapters beneath the RINADS routing/governance layer.

The merged Shiprocket foundation now includes normalized serviceability/rate evidence and read-only tracking by AWB or shipment ID. The tracking projection deliberately avoids unnecessary customer PII. Carrier mutations remain behind the existing live/write gates and are not exposed through MCP.

Initial provider mapping covers normalized quote, tracking, shipment creation, cancellation and reverse-logistics intents. Cancellation remains blocked for external agents by default.

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

1. capability entitlement + permission binding for a deliberately small READ-only allowlist;
2. RINADS organization-bound OAuth/delegation tokens for multi-organization remote agents;
3. tenant-scoped READ execution through existing service contracts;
4. Shopify adapter binding to canonical commerce reads/commands;
5. Shiprocket tracking webhook verification and shipment-event projection;
6. approval + idempotency + audit binding for DRAFT/WRITE/ACTION capabilities;
7. Delhivery production gate after staging evidence and founder approval;
8. Meta/Google campaign adapters bound to marketing publication approvals;
9. customer/business graph event normalization across commerce, growth and fulfilment;
10. RINPO Phone UI showing observe -> recommend -> authorize -> act -> verify -> audit.

## Production gate

These slices do not by themselves authorize external side effects. Do not add production credentials to source, activate a carrier write path, launch ads, apply production database migrations, or expose payment/checkout mutations merely because gateway code is merged. Each external-effect adapter needs staging evidence, explicit capability authorization and production approval.
