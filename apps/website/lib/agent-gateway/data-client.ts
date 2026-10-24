import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig, isSupabaseMode } from "@/lib/supabase/env";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { mintRinadsDelegatedRlsJwt } from "./delegated-rls-jwt";
import type { RinadsAgentPrincipal } from "./principal";

function bearerToken(request: Request): string | undefined {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const token = match?.[1]?.trim();
  return token || undefined;
}

function createDelegatedRlsClient(
  principal: RinadsAgentPrincipal
): SupabaseClient | null {
  const { url, anonKey } = getSupabasePublicConfig();
  const privateJwk = process.env.RINADS_AGENT_RLS_JWT_PRIVATE_JWK?.trim();
  const keyId = process.env.RINADS_AGENT_RLS_JWT_KID?.trim();

  if (
    !url ||
    !anonKey ||
    !privateJwk ||
    !keyId ||
    !principal.delegationTokenId ||
    !principal.delegationClient ||
    !principal.delegatedScopes ||
    !principal.delegationExpiresAt
  ) {
    return null;
  }

  try {
    const { token } = mintRinadsDelegatedRlsJwt({
      actorId: principal.actorId,
      delegationTokenId: principal.delegationTokenId,
      delegationClient: principal.delegationClient,
      delegatedScopes: principal.delegatedScopes,
      delegationExpiresAt: principal.delegationExpiresAt,
      supabaseUrl: url,
      privateJwk,
      keyId,
    });

    // Supabase accepts externally minted JWTs signed by an imported signing key
    // through the accessToken callback. The normal publishable/anon key remains
    // the API key; the delegated JWT supplies auth.uid() + role=authenticated.
    // This client never receives the service-role key.
    return createClient(url, anonKey, {
      accessToken: async () => token,
    });
  } catch {
    return null;
  }
}

/**
 * Create a user-scoped Supabase client for an already-authenticated Agent
 * Gateway request. Business data always stays behind ordinary RLS.
 *
 * - Session requests reuse the website Supabase session.
 * - Supabase bearer requests reuse the validated user access token.
 * - RINADS delegation requests receive a server-minted, very short-lived ES256
 *   user JWT whose `sub` is the already-authorized RI ID actor and whose role is
 *   only `authenticated`.
 *
 * Never substitute a service-role client here.
 */
export async function createRinadsAgentDataClient(
  request: Request,
  principal: RinadsAgentPrincipal
): Promise<SupabaseClient | null> {
  if (!isSupabaseMode()) return null;

  if (principal.authMethod === "delegation") {
    return createDelegatedRlsClient(principal);
  }

  const token = bearerToken(request);
  if (token) {
    const { url, anonKey } = getSupabasePublicConfig();
    const client = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) return null;
    return client;
  }

  const client = await createWebsiteServerClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return client as unknown as SupabaseClient;
}
