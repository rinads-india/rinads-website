import { executeRinadsCatalogRead } from "@/lib/agent-gateway/catalog-read";
import { resolveRinadsAgentPrincipal } from "@/lib/agent-gateway/principal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

function principalFailure(status: Exclude<Awaited<ReturnType<typeof resolveRinadsAgentPrincipal>>["status"], "authenticated">): Response {
  switch (status) {
    case "unauthenticated":
      return Response.json(
        { ok: false, code: "AGENT_AUTH_REQUIRED" },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    case "scope_required":
      return Response.json(
        { ok: false, code: "AGENT_ORGANIZATION_SCOPE_REQUIRED" },
        { status: 409, headers: NO_STORE_HEADERS }
      );
    case "membership_required":
      return Response.json(
        { ok: false, code: "AGENT_MEMBERSHIP_REQUIRED" },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    case "unavailable":
      return Response.json(
        { ok: false, code: "AGENT_AUTH_UNAVAILABLE" },
        { status: 503, headers: NO_STORE_HEADERS }
      );
  }
}

function catalogFailure(result: Exclude<Awaited<ReturnType<typeof executeRinadsCatalogRead>>, { ok: true }>): Response {
  const status =
    result.status === "invalid"
      ? 400
      : result.status === "unavailable"
        ? 503
        : 403;

  return Response.json(
    {
      ok: false,
      code:
        result.status === "disabled"
          ? "CAPABILITY_NOT_ENTITLED"
          : result.status === "forbidden"
            ? "CAPABILITY_PERMISSION_DENIED"
            : result.status === "invalid"
              ? "INVALID_CAPABILITY_ARGUMENTS"
              : "CAPABILITY_UNAVAILABLE",
      message: result.reason,
    },
    { status, headers: NO_STORE_HEADERS }
  );
}

export async function GET(request: Request): Promise<Response> {
  const principal = await resolveRinadsAgentPrincipal(request);
  if (principal.status !== "authenticated") {
    return principalFailure(principal.status);
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("query") ?? undefined;
  const rawLimit = url.searchParams.get("limit");
  const args: Record<string, unknown> = {};
  if (query !== undefined) args.query = query;
  if (rawLimit !== null) args.limit = Number(rawLimit);

  const result = await executeRinadsCatalogRead({
    request,
    principal: principal.principal,
    arguments: args,
  });

  if (!result.ok) return catalogFailure(result);

  return Response.json(
    { ok: true, data: result.data },
    { status: 200, headers: NO_STORE_HEADERS }
  );
}
