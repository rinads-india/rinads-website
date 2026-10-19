import { NextRequest, NextResponse } from "next/server";
import { resolveWebsiteTenancy } from "@/lib/tenancy";
import {
  createMetaGraphClient,
  hasMarketingPermission,
  metaCallbackUrl,
  metaOAuthStateSecret,
  metaReadScopes,
} from "@/lib/marketing/meta-server";
import { createMetaOAuthState } from "@/lib/marketing/meta-oauth-state";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const tenancy = await resolveWebsiteTenancy();
    if (!tenancy) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (!hasMarketingPermission(tenancy, "marketing.channels.manage")) {
      return NextResponse.json({ error: "Missing marketing.channels.manage permission" }, { status: 403 });
    }

    const state = createMetaOAuthState(
      {
        organizationId: tenancy.organizationId,
        userId: tenancy.userId,
        returnTo: request.nextUrl.searchParams.get("returnTo"),
      },
      metaOAuthStateSecret(),
    );
    const graph = createMetaGraphClient();
    const result = graph.authorization({
      organizationId: tenancy.organizationId,
      callbackUrl: metaCallbackUrl(request.url),
      requestedScopes: metaReadScopes(),
      state,
    });
    return NextResponse.redirect(result.authorizationUrl);
  } catch {
    return NextResponse.json({ error: "Meta connection is not configured for this deployment" }, { status: 503 });
  }
}
