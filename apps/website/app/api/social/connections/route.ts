/**
 * GET  /api/social/connections  — list active connections for the authenticated tenant
 * POST /api/social/connections  — start OAuth flow; returns { authorizationUrl }
 * DELETE /api/social/connections — disconnect a connection
 */
import { NextRequest, NextResponse } from "next/server";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";
import { getSocialServiceClient } from "@/lib/social-connections/supabase";
import { listConnections, disconnectConnection } from "@/lib/social-connections/connection";
import { revokeCredential } from "@/lib/social-connections/credential";
import { createOAuthSession, generateState } from "@/lib/social-connections/session";
import {
  checkOAuthStartRateLimit,
  requireConnectionManagementTier,
  requireDisconnectTier,
} from "@/lib/social-connections/guard";
import { writeSocialAuditLog } from "@/lib/social-connections/audit";
import { getProviderAdapter, PROVIDER_META } from "@/lib/social-connections/providers/index";
import { capabilityTierFromRoleKey } from "@/lib/os-org-role";
import type { SocialProviderId } from "@/lib/social-connections/types";
import { loadTenancyContext } from "@rinads/tenancy";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

async function getTenancy() {
  if (!isSupabaseMode()) return null;
  const supabase = await createWebsiteServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const ctx = await loadTenancyContext(supabase as never, { userId: user.id, email: user.email });
  return { user, ctx };
}

export async function GET() {
  const tenancy = await getTenancy();
  if (!tenancy) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  try {
    const service = getSocialServiceClient();
    const connections = await listConnections(service, tenancy.ctx.organizationId);
    return NextResponse.json({ connections }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Failed to load connections." }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  const tenancy = await getTenancy();
  if (!tenancy) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const tier = capabilityTierFromRoleKey(tenancy.ctx.roleKey);
  const gate = requireConnectionManagementTier(tier);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: 403, headers: NO_STORE });
  }

  if (!checkOAuthStartRateLimit(tenancy.ctx.organizationId)) {
    return NextResponse.json(
      { error: "Too many connection attempts. Please try again later." },
      { status: 429, headers: NO_STORE }
    );
  }

  let body: { providerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400, headers: NO_STORE });
  }

  const providerId = body.providerId as SocialProviderId;
  if (!providerId || !PROVIDER_META[providerId]) {
    return NextResponse.json({ error: "Unknown provider." }, { status: 400, headers: NO_STORE });
  }

  const adapter = getProviderAdapter(providerId);
  if (!adapter) {
    return NextResponse.json(
      { error: "This provider is not available yet." },
      { status: 422, headers: NO_STORE }
    );
  }

  const redirectBase =
    process.env.NEXT_PUBLIC_SOCIAL_REDIRECT_BASE ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://www.rinads.com";
  const redirectUri = `${redirectBase}/api/social/connections/callback`;

  const state = generateState();
  const scopes =
    providerId === "facebook"
      ? ["pages_show_list", "pages_read_engagement", "pages_manage_posts"]
      : ["instagram_basic", "instagram_content_publish", "pages_show_list", "pages_read_engagement"];

  try {
    const service = getSocialServiceClient();
    await createOAuthSession(service, {
      organizationId: tenancy.ctx.organizationId,
      initiatedBy: tenancy.user.id,
      providerId,
      state,
      redirectUri,
      scopes,
    });

    const authorizationUrl = adapter.oauthStartUrl({
      organizationId: tenancy.ctx.organizationId,
      redirectUri,
      scopes,
      state,
    });

    return NextResponse.json({ authorizationUrl }, { headers: NO_STORE });
  } catch {
    return NextResponse.json(
      { error: "Failed to initiate connection." },
      { status: 500, headers: NO_STORE }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const tenancy = await getTenancy();
  if (!tenancy) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const tier = capabilityTierFromRoleKey(tenancy.ctx.roleKey);
  const gate = requireDisconnectTier(tier);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.reason }, { status: 403, headers: NO_STORE });
  }

  let body: { connectionId?: string; credentialId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400, headers: NO_STORE });
  }

  const { connectionId, credentialId } = body;
  if (!connectionId) {
    return NextResponse.json({ error: "connectionId required." }, { status: 400, headers: NO_STORE });
  }

  try {
    const service = getSocialServiceClient();

    // Revoke token at provider (best-effort, via credential)
    if (credentialId) {
      await revokeCredential(service, credentialId, tenancy.ctx.organizationId);
    }

    await disconnectConnection(service, connectionId, tenancy.ctx.organizationId);

    await writeSocialAuditLog(service, {
      organizationId: tenancy.ctx.organizationId,
      actorType: "user",
      actorId: tenancy.user.id,
      action: "social.connection.disconnected",
      entity: "social_connections",
      entityId: connectionId,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "Failed to disconnect." }, { status: 500, headers: NO_STORE });
  }
}
