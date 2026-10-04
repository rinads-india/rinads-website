import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { buildMorningDigest, summarizeDigests, type DigestItem } from "../_shared/morning-digest.ts";

/**
 * Cron: morning digest / RINPO brief per organization.
 *
 * Disabled by default: without `RINADS_MORNING_DIGEST_ENABLED=1` the function
 * writes nothing and returns `{status:"disabled"}`. When enabled it aggregates
 * overdue invoices, stale leads, and at-risk projects into `notification_outbox`
 * rows. Organizations with no actionable signals produce zero rows — the digest
 * never fabricates work.
 */
serve(async (_req) => {
  try {
    if (Deno.env.get("RINADS_MORNING_DIGEST_ENABLED") !== "1") {
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
      .limit(100);
    if (orgsError) throw orgsError;

    const perOrgItems: DigestItem[][] = [];
    for (const org of orgs ?? []) {
      const signals = await loadDigestSignals(supabase, org.id);
      const items = buildMorningDigest(signals);
      perOrgItems.push(items);

      for (const item of items) {
        const { error } = await supabase.from("notification_outbox").insert({
          organization_id: item.organizationId,
          channel: "digest",
          template_key: `morning_digest.${item.kind}`,
          payload: { count: item.count, severity: item.severity, message: item.message },
          status: "pending",
        });
        if (error) throw error;
      }
    }

    return new Response(
      JSON.stringify({ status: "ok", ...summarizeDigests(perOrgItems) }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("morning-digest", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
});

async function loadDigestSignals(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  organizationId: string,
) {
  const nowIso = new Date().toISOString();

  // Only query org-scoped sources we can rely on. Each lookup is best-effort:
  // a missing table/column yields an omitted signal (never fabricated data).
  // Additional signals (stale CRM leads, at-risk projects) can be wired here
  // once a confirmed org-scoped source exists; the digest builder already
  // supports them.
  const overdueInvoices = await safeCount(supabase, "invoices", (q: any) =>
    q.eq("organization_id", organizationId).lt("due_date", nowIso).neq("status", "paid"),
  );

  return {
    organizationId,
    overdueInvoices: overdueInvoices ?? undefined,
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
