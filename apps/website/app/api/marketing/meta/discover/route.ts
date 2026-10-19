import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { resolveWebsiteTenancy } from "@/lib/tenancy";
import { createMetaGraphClient, hasMarketingPermission } from "@/lib/marketing/meta-server";
import { resolveMetaCredential } from "@/lib/marketing/meta-credential-store";
import {
  loadActiveMetaConnection,
  markMetaSync,
  upsertMetaAccounts,
} from "@/lib/marketing/meta-persistence";

export const runtime = "nodejs";

export async function POST() {
  const tenancy = await resolveWebsiteTenancy();
  if (!tenancy) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!hasMarketingPermission(tenancy, "marketing.channels.manage")) {
    return NextResponse.json({ error: "Missing marketing.channels.manage permission" }, { status: 403 });
  }

  const db = (await createWebsiteServerClient()) as unknown as SupabaseClient;
  let connectionId: string | null = null;
  try {
    const connection = await loadActiveMetaConnection(db, tenancy.organizationId);
    connectionId = connection.id;
    if (!connection.credentialRef) throw new Error("Meta connection has no credential reference");
    const credential = await resolveMetaCredential({
      organizationId: tenancy.organizationId,
      connectionId: connection.id,
      credentialRef: connection.credentialRef,
    });
    const graph = createMetaGraphClient({ requireAppSecret: true });
    const discovered = await graph.discoverAccounts(credential.accessToken);
    const accounts = await upsertMetaAccounts(db, tenancy.organizationId, connection.id, discovered);
    await markMetaSync(db, tenancy.organizationId, connection.id, null);
    return NextResponse.json({
      accounts: accounts.map((account) => ({
        id: account.id,
        accountType: account.accountType,
        externalAccountId: account.externalAccountId,
        displayName: account.displayName,
        username: account.username ?? null,
      })),
    });
  } catch {
    if (connectionId) {
      await markMetaSync(db, tenancy.organizationId, connectionId, "Meta account discovery failed").catch(() => undefined);
    }
    return NextResponse.json({ error: "Meta account discovery failed" }, { status: 502 });
  }
}
