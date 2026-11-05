import { createWebsiteServerClient } from "@/lib/supabase/server";
import { evaluateDriverOfferRead } from "@rinads/operations";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" } as const;
const respond = (body: Record<string, unknown>, status: number) =>
  Response.json(body, { status, headers });

/**
 * Current RI ID user may read only their own job OFFERS.
 * No order address, customer contact, GPS, payment instrument, or document PII.
 * Intentionally disabled pending approved RLS and account-linking migrations.
 */
export async function GET() {
  if (process.env.RI_DELIVERY_READ_API_ENABLED !== "true") {
    return respond({ ok: false, code: "FEATURE_NOT_LIVE" }, 503);
  }

  try {
    const client = await createWebsiteServerClient();
    const { data: identity, error: authError } = await client.auth.getUser();
    const user = identity.user;
    const gate = evaluateDriverOfferRead({
      enabled: true,
      authenticated: !authError && !!user,
      anonymousUser: user?.is_anonymous ?? false,
    });

    if (!gate.allowed || !user) {
      return respond({ ok: false, code: gate.code }, gate.status);
    }

    // The auth-scoped query is necessary but not sufficient: the DB must
    // independently enforce driver_user_id = auth.uid() through RLS.
    const { data, error } = await client
      .from("ri_delivery_offers")
      .select("id,job_id,status,payout_minor,expires_at,created_at")
      .eq("driver_user_id", user.id)
      .eq("status", "offered")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return respond({ ok: false, code: "PERSISTENCE_NOT_READY" }, 503);
    return respond({ ok: true, offers: data ?? [], source: "authenticated_driver_rls" }, 200);
  } catch {
    return respond({ ok: false, code: "SERVICE_UNAVAILABLE" }, 503);
  }
}
