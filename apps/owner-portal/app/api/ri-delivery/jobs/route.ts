import { loadOwnerAccess } from "@/lib/tenancy";
import { createOwnerServerClient } from "@/lib/supabase/server";
import { evaluateMerchantDeliveryRead } from "@rinads/operations";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store" } as const;
const respond = (body: Record<string, unknown>, status: number) =>
  Response.json(body, { status, headers: noStore });

/**
 * Merchant-only, read-only dispatch summary.
 * RI_DELIVERY_READ_API_ENABLED must remain OFF until the approved RLS
 * migration and cross-tenant tests pass. Does not send any job offers.
 */
export async function GET() {
  if (process.env.RI_DELIVERY_READ_API_ENABLED !== "true") {
    return respond({ ok: false, code: "FEATURE_NOT_LIVE" }, 503);
  }

  const access = await loadOwnerAccess(createOwnerServerClient);
  if (access.status === "unauthenticated") {
    return respond({ ok: false, code: "AUTH_REQUIRED" }, 401);
  }
  if (access.status === "forbidden") {
    return respond({ ok: false, code: "ACCESS_DENIED" }, 403);
  }

  const decision = evaluateMerchantDeliveryRead({
    enabled: true,
    authenticated: true,
    isDemo: access.demo,
    organizationActive: access.tenancy.organizationStatus === "active",
    hasLogisticsReadPermission: access.tenancy.permissions.includes("logistics.read"),
  });
  if (!decision.allowed) {
    return respond({ ok: false, code: decision.code }, decision.status);
  }

  try {
    // User-cookie SSR client. Never use the service-role client on this route.
    // Tenant ID comes from the server-resolved RI ID membership, not the request.
    const supabase = await createOwnerServerClient();
    const { data, error } = await supabase
      .from("ri_delivery_jobs")
      .select("id,status,created_at,updated_at")
      .eq("organization_id", access.tenancy.organizationId)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      // Missing migration/grants/RLS remains a closed gate. Never disclose SQL.
      return respond({ ok: false, code: "PERSISTENCE_NOT_READY" }, 503);
    }
    return respond({ ok: true, jobs: data ?? [], source: "tenant_scoped_database" }, 200);
  } catch {
    return respond({ ok: false, code: "SERVICE_UNAVAILABLE" }, 503);
  }
}
