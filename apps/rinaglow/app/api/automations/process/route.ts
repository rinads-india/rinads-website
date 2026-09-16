import { NextResponse } from "next/server";
import { getSalonDeps } from "@/lib/salon";
import { resolveTenancyContext } from "@/lib/tenancy";

export async function POST(request: Request) {
  const tenancy = await resolveTenancyContext();
  if (!tenancy) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!tenancy.permissions.includes("salon.reviews.manage") && !["founder", "super_admin"].includes(tenancy.roleKey ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as { limit?: number };
  const limit = Number.isFinite(body.limit) ? Math.max(1, Math.min(Number(body.limit), 100)) : 50;
  const { automations } = await getSalonDeps();
  const result = await automations.processDue(tenancy.organizationId, { limit });
  return result.ok
    ? NextResponse.json(result.data)
    : NextResponse.json({ error: result.error.message }, { status: 500 });
}

