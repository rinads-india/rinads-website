import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { resolveWebsiteTenancy } from "@/lib/tenancy";
import { createMetaGraphClient, hasMarketingPermission } from "@/lib/marketing/meta-server";
import {
  createMarketingServiceClient,
  resolveMetaCredential,
} from "@/lib/marketing/meta-credential-store";
import {
  loadMetaAccount,
  loadMetaConnectionById,
  markMetaSync,
} from "@/lib/marketing/meta-persistence";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const tenancy = await resolveWebsiteTenancy();
  if (!tenancy) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!hasMarketingPermission(tenancy, "marketing.read")) {
    return NextResponse.json({ error: "Missing marketing.read permission" }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const accountId =
    body && typeof body === "object" && !Array.isArray(body) && typeof (body as Record<string, unknown>).accountId === "string"
      ? (body as Record<string, string>).accountId
      : null;
  if (!accountId) return NextResponse.json({ error: "accountId is required" }, { status: 400 });

  const db = (await createWebsiteServerClient()) as unknown as SupabaseClient;
  try {
    const account = await loadMetaAccount(db, tenancy.organizationId, accountId);
    const connection = await loadMetaConnectionById(db, tenancy.organizationId, account.connectionId);
    if (!connection.credentialRef) throw new Error("Meta connection has no credential reference");
    const credential = await resolveMetaCredential({
      organizationId: tenancy.organizationId,
      connectionId: connection.id,
      credentialRef: connection.credentialRef,
    });
    const graph = createMetaGraphClient({ requireAppSecret: true });
    const result = await graph.getAccountMetrics(credential.accessToken, account);

    if (result.metrics.length > 0) {
      const serviceDb = createMarketingServiceClient();
      const { error } = await serviceDb.from("marketing_metric_snapshots").insert(
        result.metrics.map((metric) => ({
          organization_id: tenancy.organizationId,
          channel_account_id: account.id,
          campaign_id: null,
          publication_id: null,
          metric_name: metric.name,
          metric_value: metric.value,
          observed_at: metric.observedAt,
          dimensions: metric.dimensions ?? {},
          source: "meta_graph",
        })),
      );
      if (error) throw new Error("Unable to persist Meta metric snapshots");
    }

    await markMetaSync(db, tenancy.organizationId, connection.id, null);
    return NextResponse.json({ accountId: account.id, metrics: result.metrics });
  } catch {
    return NextResponse.json({ error: "Meta metrics synchronization failed" }, { status: 502 });
  }
}
