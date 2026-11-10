/**
 * GET /api/social/connections/callback
 * OAuth callback — validates state, exchanges code, stores encrypted tokens.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSocialServiceClient } from "@/lib/social-connections/supabase";
import { consumeOAuthSession } from "@/lib/social-connections/session";
import { upsertCredential } from "@/lib/social-connections/credential";
import { upsertConnections } from "@/lib/social-connections/connection";
import { writeSocialAuditLog } from "@/lib/social-connections/audit";
import { getProviderAdapter } from "@/lib/social-connections/providers/index";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import type { SocialProviderId } from "@/lib/social-connections/types";

export const dynamic = "force-dynamic";

const siteBase =
  process.env.NEXT_PUBLIC_SOCIAL_REDIRECT_BASE ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.rinads.com";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  // User denied authorization
  if (errorParam) {
    return NextResponse.redirect(
      `${siteBase}/os/growth/connections?error=access_denied`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${siteBase}/os/growth/connections?error=invalid_callback`
    );
  }

  const service = getSocialServiceClient();

  // Validate and consume the session (atomic; replays return null)
  const session = await consumeOAuthSession(service, state);
  if (!session) {
    return NextResponse.redirect(
      `${siteBase}/os/growth/connections?error=invalid_state`
    );
  }

  const redirectUri = session.redirect_uri;
  const providerId = session.provider_id as SocialProviderId;

  const adapter = getProviderAdapter(providerId);
  if (!adapter) {
    return NextResponse.redirect(
      `${siteBase}/os/growth/connections?error=unknown_provider`
    );
  }

  try {
    // Exchange code for tokens
    const tokenSet = await adapter.exchangeCode(
      code,
      state,
      redirectUri,
      session.code_verifier ?? undefined
    );

    // Identify the primary identity from the token (use account list as proxy)
    const accounts = await adapter.getConnectedAccounts(tokenSet.accessToken);
    if (accounts.length === 0) {
      return NextResponse.redirect(
        `${siteBase}/os/growth/connections?error=no_accounts&provider=${providerId}`
      );
    }

    // Store encrypted credential keyed on the first account's external ID
    const primaryAccount = accounts[0]!;
    const credentialId = await upsertCredential(service, {
      organizationId: session.organization_id,
      providerId,
      externalUserId: primaryAccount.externalId,
      tokenSet,
    });

    // Create connection rows for all accessible accounts
    await upsertConnections(service, {
      organizationId: session.organization_id,
      credentialId,
      providerId,
      accounts,
      connectedBy: session.initiated_by,
    });

    await writeSocialAuditLog(service, {
      organizationId: session.organization_id,
      actorType: "user",
      actorId: session.initiated_by,
      action: "social.connection.created",
      entity: "social_connections",
      metadata: {
        provider: providerId,
        accountCount: accounts.length,
      },
    });

    // Also write to the platform audit_logs table
    const userSupabase = await createWebsiteServerClient();
    await userSupabase.from("audit_logs").insert({
      organization_id: session.organization_id,
      actor_type: "user",
      actor_id: session.initiated_by,
      action: "social.connection.created",
      entity: "social_connections",
      after: { provider: providerId, account_count: accounts.length },
    });

    return NextResponse.redirect(
      `${siteBase}/os/growth/connections?connected=${providerId}`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // Log but do not expose provider error details
    console.error("[social/callback] token exchange failed:", message);
    return NextResponse.redirect(
      `${siteBase}/os/growth/connections?error=provider_error&provider=${providerId}`
    );
  }
}
