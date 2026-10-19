import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { resolveWebsiteTenancy } from "@/lib/tenancy";
import {
  createMetaGraphClient,
  hasMarketingPermission,
  metaCallbackUrl,
  metaOAuthStateSecret,
} from "@/lib/marketing/meta-server";
import { verifyMetaOAuthState } from "@/lib/marketing/meta-oauth-state";
import { storeMetaCredential } from "@/lib/marketing/meta-credential-store";
import {
  attachCredentialRef,
  markMetaSync,
  upsertMetaAccounts,
  upsertMetaConnection,
} from "@/lib/marketing/meta-persistence";

export const runtime = "nodejs";

function redirectWithStatus(request: NextRequest, returnTo: string, status: string) {
  const target = new URL(returnTo, request.url);
  target.searchParams.set("meta", status);
  return NextResponse.redirect(target);
}

export async function GET(request: NextRequest) {
  const tenancy = await resolveWebsiteTenancy();
  if (!tenancy) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!hasMarketingPermission(tenancy, "marketing.channels.manage")) {
    return NextResponse.json({ error: "Missing marketing.channels.manage permission" }, { status: 403 });
  }

  const stateValue = request.nextUrl.searchParams.get("state");
  if (!stateValue) return NextResponse.json({ error: "Missing OAuth state" }, { status: 400 });

  let state;
  try {
    state = verifyMetaOAuthState(stateValue, metaOAuthStateSecret());
  } catch {
    return NextResponse.json({ error: "Invalid or expired OAuth state" }, { status: 400 });
  }
  if (state.organizationId !== tenancy.organizationId || state.userId !== tenancy.userId) {
    return NextResponse.json({ error: "OAuth state does not match the active tenant" }, { status: 403 });
  }

  if (request.nextUrl.searchParams.get("error")) {
    return redirectWithStatus(request, state.returnTo, "authorization_denied");
  }
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });

  try {
    const graph = createMetaGraphClient({ requireAppSecret: true });
    const shortGrant = await graph.exchangeCode(code, metaCallbackUrl(request.url));
    const longGrant = await graph.exchangeForLongLivedToken(shortGrant.accessToken);
    const inspection = await graph.inspectToken(longGrant.accessToken);
    if (!inspection.isValid || !inspection.userId) {
      return redirectWithStatus(request, state.returnTo, "invalid_token");
    }

    const userDb = (await createWebsiteServerClient()) as unknown as SupabaseClient;
    let connection = await upsertMetaConnection(userDb, {
      organizationId: tenancy.organizationId,
      externalSubject: inspection.userId,
      scopes: inspection.scopes,
      expiresAt: longGrant.expiresAt ?? inspection.expiresAt ?? null,
    });
    const credentialRef = await storeMetaCredential({
      organizationId: tenancy.organizationId,
      connectionId: connection.id,
      accessToken: longGrant.accessToken,
      scopes: inspection.scopes,
      expiresAt: longGrant.expiresAt ?? inspection.expiresAt ?? null,
    });
    connection = await attachCredentialRef(userDb, tenancy.organizationId, connection.id, credentialRef);

    const discovered = await graph.discoverAccounts(longGrant.accessToken);
    const accounts = await upsertMetaAccounts(userDb, tenancy.organizationId, connection.id, discovered);
    await markMetaSync(userDb, tenancy.organizationId, connection.id, null);

    const target = new URL(state.returnTo, request.url);
    target.searchParams.set("meta", "connected");
    target.searchParams.set("accounts", String(accounts.length));
    return NextResponse.redirect(target);
  } catch {
    return redirectWithStatus(request, state.returnTo, "connection_failed");
  }
}
