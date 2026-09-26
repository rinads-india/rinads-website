import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { computeOrganizationHealthScore } from "../_shared/health-score.ts";

/**
 * Cron: recompute `organization_health_scores` from measurable signals.
 *
 * Disabled by default: without `RINADS_HEALTH_CHECK_ENABLED=1` the function
 * performs no writes and returns `{status:"disabled"}`. This keeps the score
 * model dormant until a founder explicitly enables it (feature-flag-off
 * default), so wiring a cron before intending to run it can never silently
 * overwrite live scores.
 */
serve(async (_req) => {
  try {
    if (Deno.env.get("RINADS_HEALTH_CHECK_ENABLED") !== "1") {
      return new Response(JSON.stringify({ status: "disabled" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: orgs, error: orgsError } = await supabase
      .from("organizations")
      .select("id")
      .eq("status", "active")
      .limit(500);
    if (orgsError) throw orgsError;

    let updated = 0;
    for (const org of orgs ?? []) {
      const signals = await loadOrganizationSignals(supabase, org.id);
      const result = computeOrganizationHealthScore(signals);
      const { error } = await supabase.from("organization_health_scores").upsert({
        organization_id: org.id,
        score: result.score,
        signals: {
          band: result.band,
          contributions: result.signals,
          neutral_baseline: result.neutralBaseline,
        },
        computed_at: new Date().toISOString(),
      });
      if (error) throw error;
      updated += 1;
    }

    return new Response(
      JSON.stringify({ status: "ok", updated }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("health-check", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});

/**
 * Gather measurable signals for one organization. Each query failure degrades
 * gracefully to an omitted signal (the score model treats missing signals as
 * neutral) rather than fabricating a value.
 */
async function loadOrganizationSignals(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  organizationId: string,
) {
  const nowIso = new Date().toISOString();

  const overdueInvoices = await safeCount(supabase, "invoices", (q: any) =>
    q.eq("organization_id", organizationId).lt("due_date", nowIso).neq("status", "paid"),
  );
  const openServiceOrders = await safeCount(supabase, "service_orders", (q: any) =>
    q.eq("organization_id", organizationId).in("status", ["pending", "in_progress"]),
  );

  return {
    overdueInvoices: overdueInvoices ?? undefined,
    openServiceOrders: openServiceOrders ?? undefined,
  };
}

// deno-lint-ignore no-explicit-any
async function safeCount(supabase: any, table: string, build: (q: any) => any): Promise<number | null> {
  try {
    const { count, error } = await build(
      supabase.from(table).select("id", { count: "exact", head: true }),
    );
    if (error) return null;
    return typeof count === "number" ? count : null;
  } catch {
    return null;
  }
}
