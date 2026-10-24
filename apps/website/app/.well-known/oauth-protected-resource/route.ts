import { rinadsMcpProtectedResourceMetadata } from "@/lib/agent-gateway/oauth";
import { getSupabasePublicConfig } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
} as const;

export async function GET(request: Request): Promise<Response> {
  const { url: supabaseUrl } = getSupabasePublicConfig();

  if (!supabaseUrl) {
    return Response.json(
      {
        error: "oauth_authorization_server_unavailable",
        error_description: "RINADS OAuth authorization server is not configured in this environment.",
      },
      { status: 503, headers: JSON_HEADERS }
    );
  }

  return Response.json(
    rinadsMcpProtectedResourceMetadata({
      requestUrl: request.url,
      supabaseUrl,
    }),
    { status: 200, headers: JSON_HEADERS }
  );
}
