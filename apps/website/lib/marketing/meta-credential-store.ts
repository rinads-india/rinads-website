import { createClient } from "@supabase/supabase-js";
import type { MetaAccessCredential, MetaCredentialResolver } from "@rinads/platform";
import {
  decryptCredentialSecret,
  encryptCredentialSecret,
  type EncryptedCredential,
} from "./meta-credential-crypto";

const CREDENTIAL_REF_PREFIX = "marketing-credential://";

function serviceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Marketing credential store requires Supabase service-role configuration");
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function encryptionKey(): string {
  const key = process.env.RINADS_MARKETING_CREDENTIAL_ENCRYPTION_KEY;
  if (!key) throw new Error("Marketing credential encryption key is not configured");
  return key;
}

function aad(organizationId: string, connectionId: string): string {
  return `rinads:marketing:${organizationId}:${connectionId}:meta:v1`;
}

function parseCredentialRef(ref: string): string {
  if (!ref.startsWith(CREDENTIAL_REF_PREFIX)) throw new Error("Unsupported marketing credential reference");
  const id = ref.slice(CREDENTIAL_REF_PREFIX.length);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error("Invalid marketing credential reference");
  }
  return id;
}

export function createMarketingServiceClient() {
  return serviceClient();
}

export async function storeMetaCredential(input: {
  organizationId: string;
  connectionId: string;
  accessToken: string;
  scopes: readonly string[];
  expiresAt?: string | null;
}): Promise<string> {
  const encrypted = encryptCredentialSecret(
    input.accessToken,
    encryptionKey(),
    aad(input.organizationId, input.connectionId),
  );
  const db = serviceClient();
  const { data, error } = await db
    .from("marketing_channel_credentials")
    .upsert(
      {
        organization_id: input.organizationId,
        connection_id: input.connectionId,
        provider: "meta",
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        algorithm: encrypted.algorithm,
        key_version: 1,
        scopes: [...input.scopes],
        expires_at: input.expiresAt ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "connection_id,organization_id" },
    )
    .select("id")
    .single();
  if (error || !data?.id) throw new Error("Unable to persist encrypted Meta credential");
  return `${CREDENTIAL_REF_PREFIX}${data.id}`;
}

export async function resolveMetaCredential(input: {
  organizationId: string;
  connectionId: string;
  credentialRef: string;
}): Promise<MetaAccessCredential> {
  const id = parseCredentialRef(input.credentialRef);
  const db = serviceClient();
  const { data, error } = await db
    .from("marketing_channel_credentials")
    .select("ciphertext,iv,auth_tag,algorithm,scopes,expires_at")
    .eq("id", id)
    .eq("organization_id", input.organizationId)
    .eq("connection_id", input.connectionId)
    .eq("provider", "meta")
    .single();
  if (error || !data) throw new Error("Meta credential reference could not be resolved");
  if (data.algorithm !== "aes-256-gcm") throw new Error("Unsupported marketing credential algorithm");

  const encrypted: EncryptedCredential = {
    ciphertext: data.ciphertext,
    iv: data.iv,
    authTag: data.auth_tag,
    algorithm: "aes-256-gcm",
  };
  const accessToken = decryptCredentialSecret(
    encrypted,
    encryptionKey(),
    aad(input.organizationId, input.connectionId),
  );
  return {
    accessToken,
    scopes: Array.isArray(data.scopes)
      ? data.scopes.filter((scope): scope is string => typeof scope === "string")
      : [],
    expiresAt: typeof data.expires_at === "string" ? data.expires_at : null,
  };
}

export const metaCredentialResolver: MetaCredentialResolver = {
  resolve: resolveMetaCredential,
};
