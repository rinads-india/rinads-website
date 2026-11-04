import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import { RINADS_AGENT_DELEGATION_TOKEN_PREFIX } from "./delegation";
import {
  rinadsMcpAuthorizationServer,
  rinadsMcpResourceUrl,
  validateRinadsMcpOAuthClaims,
} from "./oauth";
import {
  resolveRinadsAgentPrincipal as resolveBaseAgentPrincipal,
  type RinadsAgentPrincipalResolution,
} from "./principal";

export type { RinadsAgentPrincipalResolution } from "./principal";

function bearerToken(request: Request): string | undefined {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const token = match?.[1]?.trim();
  return token || undefined;
}

/**
 * MCP-specific authentication wrapper.
 *
 * Browser sessions and signed RINADS delegation tokens retain their existing
 * behavior. Ordinary Supabase bearer tokens presented to /api/mcp must be
 * OAuth client tokens whose verified JWT claims are explicitly bound to this
 * MCP resource. This prevents a generic Supabase session token from being
 * replayed as an MCP credential.
 */
export async function resolveRinadsAgentPrincipal(
  request: Request
): Promise<RinadsAgentPrincipalResolution> {
  const token = bearerToken(request);
  if (!token || token.startsWith(`${RINADS_AGENT_DELEGATION_TOKEN_PREFIX}.`)) {
    return resolveBaseAgentPrincipal(request);
  }

  const { url, anonKey } = getSupabasePublicConfig();
  if (!url || !anonKey) {
    return {
      status: "unavailable",
      reason: "RINADS MCP OAuth verification requires Supabase public authentication configuration.",
    };
  }

  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) return { status: "unauthenticated" };

  const validation = validateRinadsMcpOAuthClaims({
    claims: data.claims as Record<string, unknown>,
    expectedIssuer: rinadsMcpAuthorizationServer(url),
    expectedResource: rinadsMcpResourceUrl(request.url),
  });
  if (!validation.ok) return { status: "unauthenticated" };

  return resolveBaseAgentPrincipal(request);
}
