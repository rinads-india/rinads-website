import {
  handleRinadsMcpRequest,
  RINADS_MCP_MODERN_PROTOCOL_VERSION,
} from "@rinads/platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "MCP-Protocol-Version": RINADS_MCP_MODERN_PROTOCOL_VERSION,
} as const;

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

  const handled = handleRinadsMcpRequest(payload);
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
      execution: "disabled_until_authenticated_agent_gateway",
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
