import {
  buildExternalAgentCapabilityCatalog,
  type RinadsAgentCapabilityCatalogEntry,
  type RinadsCapabilityKey,
} from "./capability-registry";

export const RINADS_MCP_MODERN_PROTOCOL_VERSION = "2026-07-28" as const;
export const RINADS_MCP_LEGACY_PROTOCOL_VERSION = "2025-11-25" as const;

const RINADS_MCP_SERVER_INFO = {
  name: "rinads-business-intelligence",
  title: "RINADS Business Intelligence",
  version: "0.1.0",
  description:
    "Governed business capabilities exposed through RINADS Intelligence and RINPO Runtime.",
  websiteUrl: "https://www.rinads.com",
} as const;

const RINADS_MCP_INSTRUCTIONS =
  "RINADS is the authorization and business-action boundary. Organization scope is resolved server-side. " +
  "Never ask a user to provide organization_id, roles, API keys or provider secrets. Capability execution " +
  "remains fail-closed unless authenticated principal, entitlement, RINADS Intelligence policy, RINPO Runtime " +
  "approval/idempotency and audit are all bound.";

type JsonObject = Record<string, unknown>;

export type RinadsMcpJsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: JsonObject;
};

export type RinadsMcpJsonRpcResponse =
  | {
      jsonrpc: "2.0";
      id: string | number | null;
      result: unknown;
    }
  | {
      jsonrpc: "2.0";
      id: string | number | null;
      error: {
        code: number;
        message: string;
        data?: unknown;
      };
    };

export type RinadsMcpHandlerResult =
  | { kind: "response"; status: number; body: RinadsMcpJsonRpcResponse }
  | { kind: "notification"; status: 202 };

export type RinadsMcpAuthenticatedPrincipal = {
  actorId: string;
  organizationId: string;
  roleKey?: string;
  permissionIds?: readonly string[];
  authMethod: "session" | "bearer";
};

export type RinadsMcpPrincipalStatus =
  | "unauthenticated"
  | "scope_required"
  | "membership_required"
  | "unavailable";

export type RinadsMcpExecutionContext = {
  principal?: RinadsMcpAuthenticatedPrincipal;
  principalStatus?: RinadsMcpPrincipalStatus;
};

export type RinadsMcpTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: JsonObject;
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
  };
  _meta: {
    "com.rinads/capabilityKey": RinadsCapabilityKey;
    "com.rinads/risk": string;
    "com.rinads/externalAgentPolicy": string;
    "com.rinads/executionEnabled": false;
  };
};

function objectSchema(properties: JsonObject, required: string[] = []): JsonObject {
  return {
    type: "object",
    properties,
    ...(required.length > 0 ? { required } : {}),
    additionalProperties: false,
  };
}

const STRING_ID = { type: "string", minLength: 1, maxLength: 128 } as const;
const PINCODE = { type: "string", pattern: "^[0-9]{6}$" } as const;

function capabilityInputSchema(key: RinadsCapabilityKey): JsonObject {
  switch (key) {
    case "commerce.catalog.read":
      return objectSchema({
        query: { type: "string", maxLength: 200 },
        limit: { type: "integer", minimum: 1, maximum: 100 },
      });
    case "commerce.order.read":
      return objectSchema({ order_id: STRING_ID }, ["order_id"]);
    case "commerce.cart.create":
      return objectSchema(
        {
          lines: {
            type: "array",
            minItems: 1,
            maxItems: 100,
            items: objectSchema(
              {
                variant_id: STRING_ID,
                quantity: { type: "integer", minimum: 1, maximum: 999 },
              },
              ["variant_id", "quantity"]
            ),
          },
        },
        ["lines"]
      );
    case "commerce.checkout.create":
      return objectSchema({ cart_id: STRING_ID }, ["cart_id"]);
    case "logistics.quote.read":
      return objectSchema(
        {
          origin_pincode: PINCODE,
          destination_pincode: PINCODE,
          chargeable_weight_grams: { type: "integer", minimum: 1, maximum: 1000000 },
          cod: { type: "boolean" },
        },
        ["origin_pincode", "destination_pincode", "chargeable_weight_grams"]
      );
    case "logistics.shipment.track":
      return objectSchema({ shipment_id: STRING_ID, awb: STRING_ID });
    case "logistics.shipment.create":
      return objectSchema({ shipment_intent_id: STRING_ID }, ["shipment_intent_id"]);
    case "logistics.shipment.cancel":
      return objectSchema({ shipment_id: STRING_ID, reason: { type: "string", maxLength: 500 } }, [
        "shipment_id",
      ]);
    case "logistics.return.create":
      return objectSchema({ order_id: STRING_ID, reason: { type: "string", maxLength: 500 } }, ["order_id"]);
    case "growth.performance.read":
      return objectSchema({
        from: { type: "string", format: "date" },
        to: { type: "string", format: "date" },
        channel: { type: "string", maxLength: 64 },
      });
    case "growth.campaign.draft":
      return objectSchema(
        {
          objective: { type: "string", minLength: 1, maxLength: 500 },
          budget_rupees: { type: "number", exclusiveMinimum: 0, maximum: 100000000 },
          channel: { type: "string", enum: ["meta", "google", "shiprocket"] },
        },
        ["objective"]
      );
    case "growth.campaign.launch":
      return objectSchema({ campaign_draft_id: STRING_ID }, ["campaign_draft_id"]);
    case "communication.message.draft":
      return objectSchema(
        {
          recipient_id: STRING_ID,
          purpose: { type: "string", minLength: 1, maxLength: 500 },
          channel: { type: "string", enum: ["whatsapp", "email", "sms"] },
        },
        ["recipient_id", "purpose"]
      );
    case "communication.message.send":
      return objectSchema({ message_draft_id: STRING_ID }, ["message_draft_id"]);
    case "intelligence.business_summary.read":
      return objectSchema({ period: { type: "string", enum: ["today", "7d", "30d", "90d"] } });
    case "intelligence.recommendation.read":
      return objectSchema({
        domain: {
          type: "string",
          enum: ["commerce", "logistics", "growth", "communication", "operations", "finance"],
        },
      });
  }
}

function toolTitle(capability: RinadsAgentCapabilityCatalogEntry): string {
  return capability.key
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" · ");
}

export function capabilityKeyToMcpToolName(key: RinadsCapabilityKey): string {
  return `rinads.${key}`;
}

export function listRinadsMcpTools(): readonly RinadsMcpTool[] {
  return buildExternalAgentCapabilityCatalog().map((capability) => ({
    name: capabilityKeyToMcpToolName(capability.key),
    title: toolTitle(capability),
    description:
      `${capability.description} RINADS external-agent policy: ${capability.externalAgentPolicy}. ` +
      "Organization scope is resolved server-side; never include organization_id.",
    inputSchema: capabilityInputSchema(capability.key),
    annotations: {
      readOnlyHint: capability.risk === "READ",
      destructiveHint: capability.risk === "SENSITIVE",
      idempotentHint: capability.risk === "READ" || capability.risk === "DRAFT",
      openWorldHint: capability.domain === "logistics" || capability.domain === "growth",
    },
    _meta: {
      "com.rinads/capabilityKey": capability.key,
      "com.rinads/risk": capability.risk,
      "com.rinads/externalAgentPolicy": capability.externalAgentPolicy,
      "com.rinads/executionEnabled": false,
    },
  }));
}

function responseMeta(): JsonObject {
  return {
    "io.modelcontextprotocol/serverInfo": RINADS_MCP_SERVER_INFO,
  };
}

function result(id: string | number | null, value: unknown): RinadsMcpHandlerResult {
  return {
    kind: "response",
    status: 200,
    body: { jsonrpc: "2.0", id, result: value },
  };
}

function error(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
  status = 200
): RinadsMcpHandlerResult {
  return {
    kind: "response",
    status,
    body: {
      jsonrpc: "2.0",
      id,
      error: { code, message, ...(data === undefined ? {} : { data }) },
    },
  };
}

function requestId(request: RinadsMcpJsonRpcRequest): string | number | null {
  return request.id ?? null;
}

function modernDiscovery(id: string | number | null): RinadsMcpHandlerResult {
  return result(id, {
    supportedVersions: [RINADS_MCP_MODERN_PROTOCOL_VERSION, RINADS_MCP_LEGACY_PROTOCOL_VERSION],
    capabilities: { tools: { listChanged: false } },
    instructions: RINADS_MCP_INSTRUCTIONS,
    ttlMs: 300000,
    cacheScope: "public",
    _meta: responseMeta(),
  });
}

function legacyInitialize(request: RinadsMcpJsonRpcRequest): RinadsMcpHandlerResult {
  const id = requestId(request);
  const requested =
    request.params && typeof request.params.protocolVersion === "string"
      ? request.params.protocolVersion
      : RINADS_MCP_LEGACY_PROTOCOL_VERSION;

  if (requested === RINADS_MCP_MODERN_PROTOCOL_VERSION) {
    return error(
      id,
      -32602,
      "Protocol 2026-07-28 uses server/discover rather than initialize.",
      { supportedVersions: [RINADS_MCP_MODERN_PROTOCOL_VERSION, RINADS_MCP_LEGACY_PROTOCOL_VERSION] }
    );
  }

  return result(id, {
    protocolVersion: RINADS_MCP_LEGACY_PROTOCOL_VERSION,
    capabilities: { tools: { listChanged: false } },
    serverInfo: RINADS_MCP_SERVER_INFO,
    instructions: RINADS_MCP_INSTRUCTIONS,
  });
}

function toolsList(id: string | number | null): RinadsMcpHandlerResult {
  return result(id, {
    tools: listRinadsMcpTools(),
    ttlMs: 300000,
    cacheScope: "public",
    _meta: responseMeta(),
  });
}

function blockedReason(context: RinadsMcpExecutionContext): {
  reason: string;
  text: string;
} {
  if (context.principal) {
    return {
      reason: "CAPABILITY_EXECUTION_NOT_ENABLED",
      text:
        "RINADS authenticated the agent principal and resolved organization scope, but external capability " +
        "execution remains disabled until entitlement, RI policy, RINPO Runtime approval/idempotency and audit " +
        "are bound to this capability.",
    };
  }

  switch (context.principalStatus) {
    case "scope_required":
      return {
        reason: "AGENT_ORGANIZATION_SCOPE_REQUIRED",
        text:
          "This authenticated agent identity has multiple active organizations. RINADS will not accept an " +
          "organization_id from the tool call; use an organization-bound RINADS delegation token.",
      };
    case "membership_required":
      return {
        reason: "AGENT_MEMBERSHIP_REQUIRED",
        text: "The authenticated identity has no active RINADS organization membership for agent execution.",
      };
    case "unavailable":
      return {
        reason: "AGENT_AUTH_UNAVAILABLE",
        text: "RINADS agent authentication is unavailable in this environment.",
      };
    case "unauthenticated":
    default:
      return {
        reason: "AGENT_AUTH_REQUIRED",
        text: "Authenticate with a valid RINADS session or bearer access token before calling RINADS tools.",
      };
  }
}

function toolCallBlocked(
  request: RinadsMcpJsonRpcRequest,
  context: RinadsMcpExecutionContext
): RinadsMcpHandlerResult {
  const id = requestId(request);
  const params = request.params;
  const name = params && typeof params.name === "string" ? params.name : "unknown";
  const known = listRinadsMcpTools().some((tool) => tool.name === name);

  if (!known) return error(id, -32602, `Unknown RINADS tool: ${name}`);

  const blocked = blockedReason(context);
  return result(id, {
    content: [{ type: "text", text: blocked.text }],
    isError: true,
    _meta: {
      ...responseMeta(),
      "com.rinads/authenticated": Boolean(context.principal),
      "com.rinads/executionEnabled": false,
      "com.rinads/reason": blocked.reason,
    },
  });
}

export function handleRinadsMcpRequest(
  value: unknown,
  context: RinadsMcpExecutionContext = {}
): RinadsMcpHandlerResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return error(null, -32600, "Invalid JSON-RPC request.", undefined, 400);
  }

  const request = value as Partial<RinadsMcpJsonRpcRequest>;
  if (request.jsonrpc !== "2.0" || typeof request.method !== "string") {
    return error(
      typeof request.id === "string" || typeof request.id === "number" || request.id === null
        ? request.id
        : null,
      -32600,
      "Invalid JSON-RPC request.",
      undefined,
      400
    );
  }

  const normalized = request as RinadsMcpJsonRpcRequest;
  const id = requestId(normalized);

  switch (normalized.method) {
    case "server/discover":
      return modernDiscovery(id);
    case "initialize":
      return legacyInitialize(normalized);
    case "notifications/initialized":
      return { kind: "notification", status: 202 };
    case "tools/list":
      return toolsList(id);
    case "tools/call":
      return toolCallBlocked(normalized, context);
    default:
      return error(id, -32601, `Method not found: ${normalized.method}`);
  }
}
