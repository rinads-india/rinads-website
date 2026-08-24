import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/** Cron: recompute organization_health_scores from measurable signals. */
serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: orgs } = await supabase.from("organizations").select("id").eq("status", "active").limit(500);

    for (const org of orgs ?? []) {
      // TODO: compute score from invoices, activity, service orders, support — document model in ADR
      await supabase.from("organization_health_scores").upsert({
        organization_id: org.id,
        score: 70,
        signals: { placeholder: true },
        computed_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ success: true, updated: orgs?.length ?? 0 }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("health-check", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
