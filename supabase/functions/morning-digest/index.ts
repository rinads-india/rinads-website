import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

/** Cron: morning digest / RINPO brief per organization. */
serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // TODO: aggregate overdue invoices, stale leads, at-risk projects → notification_outbox
    const { data: orgs } = await supabase.from("organizations").select("id").eq("status", "active").limit(100);

    return new Response(
      JSON.stringify({ success: true, organizations_processed: orgs?.length ?? 0 }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("morning-digest", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});
