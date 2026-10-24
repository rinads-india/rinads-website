import {
  capabilityKeyToMcpToolName,
  handleRinadsMcpRequest,
  RINADS_MCP_MODERN_PROTOCOL_VERSION,
  type RinadsMcpExecutionContext,
} from "@rinads/platform";
import { executeRinadsCatalogRead } from "@/lib/agent-gateway/catalog-read";
import { executeRinadsOrderRead } from "@/lib/agent-gateway/order-read";
import {
  rinadsMcpAuthChallenge,
  rinadsMcpOAuthScopes,
  rinadsMcpResourceMetadataUrl,
  rinadsMcpSecuritySchemes,
} from "@/lib/agent-gateway/oauth";
import {
  resolveRinadsAgentPrincipal,
  type RinadsAgentPrincipalResolution,
} from "@/lib/agent-gateway/principal";
import type { RinadsExternalAgentReadScope } from "@/lib/agent-gateway/delegation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "MCP-Protocol-Version": RINADS_MCP_MODERN_PROTOCOL_VERSION,
} as const;

const CATALOG_TOOL = capabilityKeyToMcpToolName("commerce.catalog.read");
const ORDER_TOOL = capabilityKeyToMcpToolName("commerce.order.read");

type JsonObject = Record<string, unknown>;
type AuthenticatedResolution = Extract<
  RinadsAgentPrincipalResolution,
  { status: "authenticated" }
>;

type ReadCapabilityFailure = {
  ok: false;
  status: "invalid" | "forbidden" | "disabled" | "not_found" | "unavailable";
  reason: string;
};

type ReadCapabilityResult =
  | { ok: true; data: Record<string, unknown> }
  | ReadCapabilityFailure;

function asRecord(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

function executionContext(resolution: RinadsAgentPrincipalResolution): RinadsMcpExecutionContext {
  if (resolution.status === "authenticated") {
    return {
      principal: {
        actorId: resolution.principal.actorId,
        organizationId: resolution.principal.organizationId,
        roleKey: resolution.principal.roleKey,
        permissionIds: resolution.principal.permissionIds,
        // The platform MCP contract predates organization-bound delegation.
        // Generic blocked responses only need authenticated-vs-not state; the
        // route keeps the precise delegation method on RinadsAgentPrincipal.
        authMethod:
          resolution.principal.authMethod === "delegation"
            ? "bearer"
            : resolution.principal.authMethod,
      },
    };
  }

  return { principalStatus: resolution.status };
}

function requestId(payload: unknown): string | number | null {
  const id = asRecord(payload)?.id;
  return typeof id === "string" || typeof id === "number" || id === null ? id : null;
}

function toolName(payload: unknown): string | undefined {
  const request = asRecord(payload);
  if (request?.jsonrpc !== "2.0" || request.method !== "tools/call") return undefined;
  if (typeof request.id !== "string" && typeof request.id !== "number") return undefined;
  const params = asRecord(request.params);
  return typeof params?.name === "string" ? params.name : undefined;
}

function toolArguments(payload: unknown): unknown {
  const params = asRecord(asRecord(payload)?.params);
  return params?.arguments;
}

function withToolSecuritySchemes(body: unknown): unknown {
  const root = asRecord(body);
  const result = asRecord(root?.result);
  if (!root || !result || !Array.isArray(result.tools)) return body;

  return {
    ...root,
    result: {
      ...result,
      tools: result.tools.map((tool) => {
        const record = asRecord(tool);
        if (!record) return tool;
        return {
          ...record,
          securitySchemes: rinadsMcpSecuritySchemes(),
        };
      }),
    },
  };
}

function withAuthenticationChallenge(input: {
  body: unknown;
  payload: unknown;
  request: Request;
  resolution: RinadsAgentPrincipalResolution;
}): unknown {
  if (input.resolution.status !== "unauthenticated" || !toolName(input.payload)) {
    return input.body;
  }

  const root = asRecord(input.body);
  const result = asRecord(root?.result);
  const meta = asRecord(result?._meta);

  if (
    !root ||
    !result ||
    result.isError !== true ||
    meta?.["com.rinads/reason"] !== "AGENT_AUTH_REQUIRED"
  ) {
    return input.body;
  }

  return {
    ...root,
    result: {
      ...result,
      _meta: {
        ...meta,
        "mcp/www_authenticate": [rinadsMcpAuthChallenge(input.request.url)],
      },
    },
  };
}

function failureCode(status: ReadCapabilityFailure["status"]): string {
  switch (status) {
    case "invalid":
      return "INVALID_CAPABILITY_ARGUMENTS";
    case "forbidden":
      return "CAPABILITY_PERMISSION_DENIED";
    case "disabled":
      return "CAPABILITY_NOT_ENTITLED";
    case "not_found":
      return "RESOURCE_NOT_FOUND";
    case "unavailable":
      return "CAPABILITY_UNAVAILABLE";
  }
}

function readMcpResponse(input: {
  payload: unknown;
  capabilityKey: "commerce.catalog.read" | "commerce.order.read";
  successText: string;
  result: ReadCapabilityResult;
}): Response {
  if (!input.result.ok) {
    return Response.json(
      {
        jsonrpc: "2.0",
        id: requestId(input.payload),
        result: {
          content: [{ type: "text", text: input.result.reason }],
          isError: true,
          _meta: {
            "com.rinads/authenticated": true,
            "com.rinads/capabilityKey": input.capabilityKey,
            "com.rinads/executionEnabled": false,
            "com.rinads/reason": failureCode(input.result.status),
          },
        },
      },
      { status: 200, headers: JSON_HEADERS }
    );
  }

  return Response.json(
    {
      jsonrpc: "2.0",
      id: requestId(input.payload),
      result: {
        content: [{ type: "text", text: input.successText }],
        structuredContent: input.result.data,
        isError: false,
        _meta: {
          "com.rinads/authenticated": true,
          "com.rinads/capabilityKey": input.capabilityKey,
          "com.rinads/executionEnabled": true,
          "com.rinads/risk": "READ",
        },
      },
    },
    { status: 200, headers: JSON_HEADERS }
  );
}

function delegationAllowsCapability(
  resolution: AuthenticatedResolution,
  capabilityKey: RinadsExternalAgentReadScope
): boolean {
  if (resolution.principal.authMethod !== "delegation") return true;
  return resolution.principal.delegatedScopes?.includes(capabilityKey) === true;
}

function delegatedScopeDeniedResponse(input: {
  payload: unknown;
  resolution: AuthenticatedResolution;
  capabilityKey: RinadsExternalAgentReadScope;
}): Response {
  return Response.json(
    {
      jsonrpc: "2.0",
      id: requestId(input.payload),
      result: {
        content: [
          {
            type: "text",
            text: `This delegation does not grant the requested capability: ${input.capabilityKey}.`,
          },
        ],
        isError: true,
        _meta: {
          "com.rinads/authenticated": true,
          "com.rinads/authMethod": "delegation",
          "com.rinads/delegationClient":
            input.resolution.principal.delegationClient ?? null,
          "com.rinads/capabilityKey": input.capabilityKey,
          "com.rinads/executionEnabled": false,
          "com.rinads/reason": "DELEGATION_SCOPE_DENIED",
        },
      },
    },
    { status: 200, headers: JSON_HEADERS }
  );
}

async function executeEnabledRead(
  request: Request,
  payload: unknown,
  resolution: AuthenticatedResolution
): Promise<Response | null> {
  const name = toolName(payload);

  if (name === CATALOG_TOOL) {
    if (!delegationAllowsCapability(resolution, "commerce.catalog.read")) {
      return delegatedScopeDeniedResponse({
        payload,
        resolution,
        capabilityKey: "commerce.catalog.read",
      });
    }

    const result = await executeRinadsCatalogRead({
      request,
      principal: resolution.principal,
      arguments: toolArguments(payload),
    });
    return readMcpResponse({
      payload,
      capabilityKey: "commerce.catalog.read",
      successText: "Authorized RINADS commerce catalog read completed.",
      result,
    });
  }

  if (name === ORDER_TOOL) {
    if (!delegationAllowsCapability(resolution, "commerce.order.read")) {
      return delegatedScopeDeniedResponse({
        payload,
        resolution,
        capabilityKey: "commerce.order.read",
      });
    }

    const result = await executeRinadsOrderRead({
      request,
      principal: resolution.principal,
      arguments: toolArguments(payload),
    });
    return readMcpResponse({
      payload,
      capabilityKey: "commerce.order.read",
      successText: "Authorized RINADS tenant-owned order read completed.",
      result,
    });
  }

  return null;
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error: request body must be valid JSON." },
      },
      { status: 400, headers: JSON_HEADERS }
    );
  }

  const resolution = await resolveRinadsAgentPrincipal(request);
  if (resolution.status === "authenticated") {
    const enabledRead = await executeEnabledRead(request, payload, resolution);
    if (enabledRead) return enabledRead;
  }

  const handled = handleRinadsMcpRequest(payload, executionContext(resolution));
  if (handled.kind === "notification") {
    return new Response(null, {
      status: handled.status,
      headers: {
        "Cache-Control": "no-store",
        "MCP-Protocol-Version": RINADS_MCP_MODERN_PROTOCOL_VERSION,
      },
    });
  }

  const withAuthentication = withAuthenticationChallenge({
    body: handled.body,
    payload,
    request,
    resolution,
  });
  const responseBody = withToolSecuritySchemes(withAuthentication);

  return Response.json(responseBody, {
    status: handled.status,
    headers: JSON_HEADERS,
  });
}

export async function GET(request: Request): Promise<Response> {
  return Response.json(
    {
      name: "RINADS MCP Gateway",
      protocol: RINADS_MCP_MODERN_PROTOCOL_VERSION,
      transport: "streamable-http/stateless-json",
      authentication: "oauth2-supabase-or-rinads-session-or-ri-delegation",
      oauth: {
        protectedResourceMetadata: rinadsMcpResourceMetadataUrl(request.url),
        scopes: rinadsMcpOAuthScopes(),
      },
      organizationScope: "server-resolved",
      execution: {
        default: "disabled_until_capability_policy_binding",
        enabledReadCapabilities: ["commerce.catalog.read", "commerce.order.read"],
        delegationConsumption:
          "internal_short_lived_es256_rls_bridge_when_signing_key_is_configured",
        entitlementRequired: true,
      },
      endpoint: "/api/mcp",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    }
  );
}
