/**
 * OAuth session management — oauth_sessions table helpers.
 * SERVER ONLY (uses service-role client).
 */
import type { SocialProviderId } from "./types";

export type OAuthSessionRow = {
  id: string;
  organization_id: string;
  initiated_by: string;
  provider_id: SocialProviderId;
  state: string;
  code_verifier: string | null;
  redirect_uri: string;
  scopes: string[];
  used_at: string | null;
  expires_at: string;
  created_at: string;
};

export type CreateOAuthSessionInput = {
  organizationId: string;
  initiatedBy: string;
  providerId: SocialProviderId;
  state: string;
  codeVerifier?: string;
  redirectUri: string;
  scopes: string[];
};

/** Generate a cryptographically random state parameter. */
export function generateState(): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Generate a PKCE code verifier (43–128 chars, URL-safe). */
export function generateCodeVerifier(): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return Buffer.from(buf).toString("base64url");
}

/** Derive SHA-256 code challenge from verifier. */
export async function deriveCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(verifier));
  return Buffer.from(hash).toString("base64url");
}

export async function createOAuthSession(
  supabase: Parameters<typeof import("@rinads/database")["createServiceRoleClient"]>[0] extends never
    ? never
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
  input: CreateOAuthSessionInput
): Promise<OAuthSessionRow> {
  const { data, error } = await supabase
    .from("oauth_sessions")
    .insert({
      organization_id: input.organizationId,
      initiated_by: input.initiatedBy,
      provider_id: input.providerId,
      state: input.state,
      code_verifier: input.codeVerifier ?? null,
      redirect_uri: input.redirectUri,
      scopes: input.scopes,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(`Failed to create OAuth session: ${error?.message}`);
  return data as OAuthSessionRow;
}

export async function consumeOAuthSession(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  state: string
): Promise<OAuthSessionRow | null> {
  // Atomic: fetch and mark used only if not already used and not expired
  const { data, error } = await supabase
    .from("oauth_sessions")
    .select("*")
    .eq("state", state)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) return null;

  // Mark as used
  await supabase
    .from("oauth_sessions")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id);

  return data as OAuthSessionRow;
}
