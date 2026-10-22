import { buildExternalAgentCapabilityCatalog } from "@rinads/platform";

export const dynamic = "force-static";

export async function GET() {
  return Response.json(
    {
      name: "RINADS Agent Capability Gateway",
      version: "2026-10-22",
      mode: "discovery_only",
      execution: {
        enabled: false,
        note: "Tool execution requires authenticated tenant context, authorization, Runtime policy and audit. This endpoint is metadata only.",
      },
      capabilities: buildExternalAgentCapabilityCatalog(),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    }
  );
}
