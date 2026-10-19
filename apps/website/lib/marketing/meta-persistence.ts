import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ChannelAccount,
  ChannelConnection,
  DiscoveredChannelAccount,
} from "@rinads/platform";

type Row = Record<string, unknown>;

function asRow(value: unknown): Row {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid marketing persistence row");
  return value as Row;
}

function connectionFromRow(value: unknown): ChannelConnection {
  const row = asRow(value);
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    provider: "meta",
    status: row.status === "revoked" || row.status === "degraded" || row.status === "pending" ? row.status : "active",
    credentialRef: typeof row.credential_ref === "string" ? row.credential_ref : null,
    scopes: Array.isArray(row.scopes) ? row.scopes.filter((scope): scope is string => typeof scope === "string") : [],
    externalSubject: typeof row.external_subject === "string" ? row.external_subject : null,
    tokenExpiresAt: typeof row.token_expires_at === "string" ? row.token_expires_at : null,
    lastVerifiedAt: typeof row.last_verified_at === "string" ? row.last_verified_at : null,
    metadata: row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {},
  };
}

function accountFromRow(value: unknown): ChannelAccount {
  const row = asRow(value);
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    connectionId: String(row.connection_id),
    provider: "meta",
    accountType: String(row.account_type),
    externalAccountId: String(row.external_account_id),
    displayName: String(row.display_name),
    username: typeof row.username === "string" ? row.username : null,
    status: row.status === "disabled" || row.status === "disconnected" ? row.status : "active",
    metadata: row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {},
  };
}

export async function upsertMetaConnection(
  db: SupabaseClient,
  input: {
    organizationId: string;
    externalSubject: string;
    scopes: readonly string[];
    expiresAt?: string | null;
  },
): Promise<ChannelConnection> {
  const { data: existing, error: lookupError } = await db
    .from("channel_connections")
    .select("id,organization_id,status,credential_ref,scopes,external_subject,token_expires_at,last_verified_at,metadata")
    .eq("organization_id", input.organizationId)
    .eq("provider", "meta")
    .eq("external_subject", input.externalSubject)
    .maybeSingle();
  if (lookupError) throw new Error("Unable to inspect existing Meta connection");

  const patch = {
    status: "active",
    scopes: [...input.scopes],
    token_expires_at: input.expiresAt ?? null,
    last_verified_at: new Date().toISOString(),
    last_sync_error: null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await db
      .from("channel_connections")
      .update(patch)
      .eq("id", existing.id)
      .eq("organization_id", input.organizationId)
      .select("id,organization_id,status,credential_ref,scopes,external_subject,token_expires_at,last_verified_at,metadata")
      .single();
    if (error || !data) throw new Error("Unable to update Meta connection");
    return connectionFromRow(data);
  }

  const { data, error } = await db
    .from("channel_connections")
    .insert({
      organization_id: input.organizationId,
      provider: "meta",
      external_subject: input.externalSubject,
      credential_ref: null,
      metadata: { mode: "read_only", phase: "0.1" },
      ...patch,
    })
    .select("id,organization_id,status,credential_ref,scopes,external_subject,token_expires_at,last_verified_at,metadata")
    .single();
  if (error || !data) throw new Error("Unable to create Meta connection");
  return connectionFromRow(data);
}

export async function attachCredentialRef(
  db: SupabaseClient,
  organizationId: string,
  connectionId: string,
  credentialRef: string,
): Promise<ChannelConnection> {
  const { data, error } = await db
    .from("channel_connections")
    .update({ credential_ref: credentialRef, status: "active", updated_at: new Date().toISOString() })
    .eq("id", connectionId)
    .eq("organization_id", organizationId)
    .select("id,organization_id,status,credential_ref,scopes,external_subject,token_expires_at,last_verified_at,metadata")
    .single();
  if (error || !data) throw new Error("Unable to attach Meta credential reference");
  return connectionFromRow(data);
}

export async function loadActiveMetaConnection(
  db: SupabaseClient,
  organizationId: string,
): Promise<ChannelConnection> {
  const { data, error } = await db
    .from("channel_connections")
    .select("id,organization_id,status,credential_ref,scopes,external_subject,token_expires_at,last_verified_at,metadata")
    .eq("organization_id", organizationId)
    .eq("provider", "meta")
    .in("status", ["active", "degraded"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();
  if (error || !data) throw new Error("No active Meta connection is configured");
  return connectionFromRow(data);
}

export async function upsertMetaAccounts(
  db: SupabaseClient,
  organizationId: string,
  connectionId: string,
  accounts: readonly DiscoveredChannelAccount[],
): Promise<readonly ChannelAccount[]> {
  const persisted: ChannelAccount[] = [];
  for (const account of accounts) {
    if (account.provider !== "meta") continue;
    const { data, error } = await db
      .from("channel_accounts")
      .upsert(
        {
          organization_id: organizationId,
          connection_id: connectionId,
          provider: "meta",
          account_type: account.accountType,
          external_account_id: account.externalAccountId,
          display_name: account.displayName,
          username: account.username ?? null,
          status: "active",
          metadata: {
            ...(account.metadata ?? {}),
            externalParentId: account.externalParentId ?? null,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,provider,external_account_id" },
      )
      .select("id,organization_id,connection_id,provider,account_type,external_account_id,display_name,username,status,metadata")
      .single();
    if (error || !data) throw new Error("Unable to persist discovered Meta channel account");
    persisted.push(accountFromRow(data));
  }
  return persisted;
}

export async function loadMetaAccount(
  db: SupabaseClient,
  organizationId: string,
  accountId: string,
): Promise<ChannelAccount> {
  const { data, error } = await db
    .from("channel_accounts")
    .select("id,organization_id,connection_id,provider,account_type,external_account_id,display_name,username,status,metadata")
    .eq("organization_id", organizationId)
    .eq("id", accountId)
    .eq("provider", "meta")
    .single();
  if (error || !data) throw new Error("Meta channel account was not found");
  return accountFromRow(data);
}

export async function loadMetaConnectionById(
  db: SupabaseClient,
  organizationId: string,
  connectionId: string,
): Promise<ChannelConnection> {
  const { data, error } = await db
    .from("channel_connections")
    .select("id,organization_id,status,credential_ref,scopes,external_subject,token_expires_at,last_verified_at,metadata")
    .eq("organization_id", organizationId)
    .eq("id", connectionId)
    .eq("provider", "meta")
    .single();
  if (error || !data) throw new Error("Meta connection was not found");
  return connectionFromRow(data);
}

export async function markMetaSync(
  db: SupabaseClient,
  organizationId: string,
  connectionId: string,
  errorMessage: string | null,
): Promise<void> {
  const { error } = await db
    .from("channel_connections")
    .update({
      last_synced_at: new Date().toISOString(),
      last_sync_error: errorMessage,
      status: errorMessage ? "degraded" : "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
    .eq("organization_id", organizationId);
  if (error) throw new Error("Unable to update Meta synchronization status");
}
