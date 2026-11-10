/**
 * social_connections table helpers — SERVER ONLY.
 */
import type { ConnectedAccount, SocialConnectionView, SocialProviderId } from "./types";
import { PROVIDER_META } from "./providers/registry";

export async function upsertConnections(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  {
    organizationId,
    credentialId,
    providerId,
    accounts,
    connectedBy,
  }: {
    organizationId: string;
    credentialId: string;
    providerId: SocialProviderId;
    accounts: ConnectedAccount[];
    connectedBy: string;
  }
): Promise<string[]> {
  const rows = accounts.map((account) => ({
    organization_id: organizationId,
    credential_id: credentialId,
    provider_id: providerId,
    account_type: account.accountType,
    external_id: account.externalId,
    display_name: account.displayName,
    avatar_url: account.avatarUrl ?? null,
    username: account.username ?? null,
    follower_count: account.followerCount ?? null,
    connected_by: connectedBy,
    health_state: "healthy" as const,
    disconnected_at: null,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("social_connections")
    .upsert(rows, {
      onConflict: "organization_id,provider_id,external_id",
    })
    .select("id");

  if (error) throw new Error(`Failed to upsert connections: ${error.message}`);
  return (data ?? []).map((r: { id: string }) => r.id);
}

export async function listConnections(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  organizationId: string,
  includeDisconnected = false
): Promise<SocialConnectionView[]> {
  let query = supabase
    .from("social_connections")
    .select(
      "id,organization_id,credential_id,provider_id,account_type,external_id,display_name,avatar_url,username,follower_count,health_state,last_checked_at,disconnected_at,created_at,connected_by"
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (!includeDisconnected) {
    query = query.is("disconnected_at", null);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list connections: ${error.message}`);

  return ((data ?? []) as Array<Record<string, unknown>>).map((row): SocialConnectionView => {
    const pid = row.provider_id as SocialProviderId;
    const meta = PROVIDER_META[pid];
    return {
      id: row.id as string,
      organizationId: row.organization_id as string,
      providerId: pid,
      credentialId: row.credential_id as string,
      providerName: meta?.name ?? pid,
      providerIcon: meta?.icon ?? "🔗",
      accountType: row.account_type as string,
      externalId: row.external_id as string,
      displayName: row.display_name as string,
      profileImageUrl: (row.avatar_url as string | null) ?? null,
      username: (row.username as string | null) ?? null,
      followerCount: (row.follower_count as number | null) ?? null,
      healthState: row.health_state as SocialConnectionView["healthState"],
      lastCheckedAt: (row.last_checked_at as string | null) ?? null,
      connectedAt: row.created_at as string,
      connectedBy: row.connected_by as string,
      disconnectedAt: null,
    };
  });
}

export async function disconnectConnection(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  connectionId: string,
  organizationId: string
): Promise<void> {
  const { error } = await supabase
    .from("social_connections")
    .update({
      disconnected_at: new Date().toISOString(),
      health_state: "error",
    })
    .eq("id", connectionId)
    .eq("organization_id", organizationId);

  if (error) throw new Error(`Failed to disconnect: ${error.message}`);
}
