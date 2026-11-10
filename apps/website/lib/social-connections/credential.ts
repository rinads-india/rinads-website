/**
 * social_credentials table helpers — SERVER ONLY.
 * Tokens are always encrypted before writing; never returned to the client.
 */
import { encryptTokenSet, decryptTokenSet } from "./crypto";
import type { OAuthTokenSet, SocialProviderId } from "./types";

export type CredentialRow = {
  id: string;
  organization_id: string;
  provider_id: SocialProviderId;
  external_user_id: string;
  granted_scopes: string[];
  expires_at: string | null;
  refresh_expires_at: string | null;
  key_version: number;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
  // token fields intentionally excluded from public type
};

export async function upsertCredential(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  {
    organizationId,
    providerId,
    externalUserId,
    tokenSet,
  }: {
    organizationId: string;
    providerId: SocialProviderId;
    externalUserId: string;
    tokenSet: OAuthTokenSet;
  }
): Promise<string> {
  const { ciphertext, iv, tag, keyVersion } = await encryptTokenSet(tokenSet);

  const { data, error } = await supabase
    .from("social_credentials")
    .upsert(
      {
        organization_id: organizationId,
        provider_id: providerId,
        external_user_id: externalUserId,
        token_ciphertext: ciphertext,
        token_iv: iv,
        token_tag: tag,
        granted_scopes: tokenSet.grantedScopes,
        expires_at: tokenSet.expiresAt?.toISOString() ?? null,
        refresh_expires_at: tokenSet.refreshExpiresAt?.toISOString() ?? null,
        key_version: keyVersion,
        revoked_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,provider_id,external_user_id" }
    )
    .select("id")
    .single();

  if (error || !data) throw new Error(`Failed to upsert credential: ${error?.message}`);
  return data.id as string;
}

export async function getDecryptedTokenSet(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  credentialId: string,
  organizationId: string
): Promise<OAuthTokenSet | null> {
  const { data, error } = await supabase
    .from("social_credentials")
    .select("token_ciphertext, token_iv, token_tag, key_version")
    .eq("id", credentialId)
    .eq("organization_id", organizationId)
    .is("revoked_at", null)
    .single();

  if (error || !data) return null;

  return decryptTokenSet(
    data.token_ciphertext,
    data.token_iv,
    data.token_tag,
    data.key_version
  );
}

export async function revokeCredential(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  credentialId: string,
  organizationId: string
): Promise<void> {
  await supabase
    .from("social_credentials")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", credentialId)
    .eq("organization_id", organizationId);
}
