import { executeRinadsOrderRead } from "@/lib/agent-gateway/order-read";
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

function orderFailure(result: Exclude<Awaited<ReturnType<typeof executeRinadsOrderRead>>, { ok: true }>): Response {
  const status =
    result.status === "invalid"
      ? 400
      : result.status === "not_found"
        ? 404
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
              : result.status === "not_found"
                ? "RESOURCE_NOT_FOUND"
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
  const result = await executeRinadsOrderRead({
    request,
    principal: principal.principal,
    arguments: { order_id: url.searchParams.get("order_id") },
  });

  if (!result.ok) return orderFailure(result);

  return Response.json(
    { ok: true, data: result.data },
    { status: 200, headers: NO_STORE_HEADERS }
  );
}
