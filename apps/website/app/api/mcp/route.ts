import {
  capabilityKeyToMcpToolName,
  handleRinadsMcpRequest,
  RINADS_MCP_MODERN_PROTOCOL_VERSION,
  type RinadsMcpExecutionContext,
} from "@rinads/platform";
import { executeRinadsCatalogRead } from "@/lib/agent-gateway/catalog-read";
import {
  resolveRinadsAgentPrincipal,
  type RinadsAgentPrincipalResolution,
} from "@/lib/agent-gateway/principal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "MCP-Protocol-Version": RINADS_MCP_MODERN_PROTOCOL_VERSION,
} as const;

const CATALOG_TOOL = capabilityKeyToMcpToolName("commerce.catalog.read");

type JsonObject = Record<string, unknown>;

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
        authMethod: resolution.principal.authMethod,
      },
    };
  }

  return { principalStatus: resolution.status };
}

function requestId(payload: unknown): string | number | null {
  const id = asRecord(payload)?.id;
  return typeof id === "string" || typeof id === "number" || id === null ? id : null;
}

function isCatalogToolCall(payload: unknown): boolean {
  const request = asRecord(payload);
  if (request?.jsonrpc !== "2.0" || request.method !== "tools/call") return false;
  if (typeof request.id !== "string" && typeof request.id !== "number") return false;
  const params = asRecord(request.params);
  return params?.name === CATALOG_TOOL;
}

function catalogArguments(payload: unknown): unknown {
  const params = asRecord(asRecord(payload)?.params);
  return params?.arguments;
}

async function executeCatalogMcpCall(
  request: Request,
  payload: unknown,
  resolution: Extract<RinadsAgentPrincipalResolution, { status: "authenticated" }>
): Promise<Response> {
  const catalog = await executeRinadsCatalogRead({
    request,
    principal: resolution.principal,
    arguments: catalogArguments(payload),
  });

  if (!catalog.ok) {
    const reason =
      catalog.status === "invalid"
        ? "INVALID_CAPABILITY_ARGUMENTS"
        : catalog.status === "forbidden"
          ? "CAPABILITY_PERMISSION_DENIED"
          : catalog.status === "disabled"
            ? "CAPABILITY_NOT_ENTITLED"
            : "CAPABILITY_UNAVAILABLE";

    return Response.json(
      {
        jsonrpc: "2.0",
        id: requestId(payload),
        result: {
          content: [{ type: "text", text: catalog.reason }],
          isError: true,
          _meta: {
            "com.rinads/authenticated": true,
            "com.rinads/capabilityKey": "commerce.catalog.read",
            "com.rinads/executionEnabled": false,
            "com.rinads/reason": reason,
          },
        },
      },
      { status: 200, headers: JSON_HEADERS }
    );
  }

  return Response.json(
    {
      jsonrpc: "2.0",
      id: requestId(payload),
      result: {
        content: [{ type: "text", text: "Authorized RINADS commerce catalog read completed." }],
        structuredContent: catalog.data,
        isError: false,
        _meta: {
          "com.rinads/authenticated": true,
          "com.rinads/capabilityKey": "commerce.catalog.read",
          "com.rinads/executionEnabled": true,
          "com.rinads/risk": "READ",
        },
      },
    },
    { status: 200, headers: JSON_HEADERS }
  );
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
  if (resolution.status === "authenticated" && isCatalogToolCall(payload)) {
    return executeCatalogMcpCall(request, payload, resolution);
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

  return Response.json(handled.body, {
    status: handled.status,
    headers: JSON_HEADERS,
  });
}

export async function GET(): Promise<Response> {
  return Response.json(
    {
      name: "RINADS MCP Gateway",
      protocol: RINADS_MCP_MODERN_PROTOCOL_VERSION,
      transport: "streamable-http/stateless-json",
      authentication: "rinads-session-or-bearer",
      organizationScope: "server-resolved",
      execution: {
        default: "disabled_until_capability_policy_binding",
        enabledReadCapabilities: ["commerce.catalog.read"],
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
