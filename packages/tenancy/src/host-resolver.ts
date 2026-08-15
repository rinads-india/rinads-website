import type { TenancyContext } from "./types";
import { requireOrgActive } from "./context";
import { planFeatureFlags, evaluateFeatureFlags } from "./feature-flags";
import type { FeatureFlagDefinition, FeatureFlagOverrides } from "./feature-flags-types";

export type HostResolverClient = {
  from: (table: string) => {
    select: (cols?: string) => {
      eq: (
        col: string,
        val: string
      ) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
    };
  };
};

export type HostTenancyResult =
  | { ok: true; context: TenancyContext }
  | { ok: false; reason: string; status: number };

export async function resolveTenancyFromHost(
  host: string,
  client: HostResolverClient,
  platformDomain = "store.rinads.com"
): Promise<HostTenancyResult> {
  const normalized = host.toLowerCase().split(":")[0]!;
  let organizationId: string | null = null;
  let storefrontSlug: string | null = null;

  if (normalized.endsWith(`.${platformDomain}`)) {
    storefrontSlug = normalized.slice(0, -(platformDomain.length + 1));
    if (!storefrontSlug || storefrontSlug.includes(".")) {
      return { ok: false, reason: "Invalid storefront host.", status: 404 };
    }
    const { data } = await client
      .from("organization_settings")
      .select("organization_id, storefront_slug")
      .eq("storefront_slug", storefrontSlug);
    organizationId = data?.[0]?.organization_id ? String(data[0].organization_id) : null;
  } else {
    const { data } = await client
      .from("organization_domains")
      .select("organization_id, hostname, status")
      .eq("hostname", normalized);
    const row = data?.find((r) => r.status === "active" || r.status === "verified");
    organizationId = row?.organization_id ? String(row.organization_id) : null;
    if (organizationId) {
      const { data: settings } = await client
        .from("organization_settings")
        .select("storefront_slug")
        .eq("organization_id", organizationId);
      storefrontSlug = settings?.[0]?.storefront_slug ? String(settings[0].storefront_slug) : null;
    }
  }

  if (!organizationId) {
    return { ok: false, reason: "Store not found.", status: 404 };
  }

  const { data: orgRows } = await client.from("organizations").select("id, name, slug, status").eq("id", organizationId);
  const org = orgRows?.[0];
  if (!org) {
    return { ok: false, reason: "Organization not found.", status: 404 };
  }

  const status = String(org.status) as TenancyContext["organizationStatus"];
  const draftContext: TenancyContext = {
    userId: "guest",
    organizationId,
    organizationSlug: storefrontSlug ?? String(org.slug),
    organizationStatus: status,
    roleKey: "client",
    permissions: [],
    memberships: [],
    planKey: "starter",
    featureFlags: planFeatureFlags({ planKey: "starter" }),
  };

  const active = requireOrgActive(draftContext);
  if (!active.allowed) {
    return { ok: false, reason: active.reason ?? "Unavailable", status: 403 };
  }

  const { data: subRows } = await client
    .from("organization_subscriptions")
    .select("plan_key")
    .eq("organization_id", organizationId);
  const planKey = subRows?.[0]?.plan_key ? String(subRows[0].plan_key) : "starter";

  const { data: settingsRows } = await client
    .from("organization_settings")
    .select("vertical_key")
    .eq("organization_id", organizationId);
  const verticalKey = settingsRows?.[0]?.vertical_key ? String(settingsRows[0].vertical_key) : undefined;

  const overrides = await loadFeatureFlagOverrides(client, organizationId);
  const definitions = defaultFlagDefinitions();
  const evaluated = evaluateFeatureFlags(definitions, overrides, { organizationId });

  const context: TenancyContext = {
    userId: "guest",
    organizationId,
    organizationSlug: storefrontSlug ?? String(org.slug),
    organizationStatus: status,
    roleKey: "client",
    permissions: [],
    memberships: [],
    planKey,
    verticalKey,
    featureFlags: { ...planFeatureFlags({ planKey, verticalKey }), ...evaluated },
  };

  return { ok: true, context };
}

async function loadFeatureFlagOverrides(
  client: HostResolverClient,
  organizationId: string
): Promise<FeatureFlagOverrides> {
  const { data } = await client
    .from("feature_flag_overrides")
    .select("flag_key, organization_id, user_id, enabled")
    .eq("organization_id", organizationId);

  return (data ?? []).map((row) => ({
    flagKey: String(row.flag_key),
    organizationId: row.organization_id ? String(row.organization_id) : undefined,
    userId: row.user_id ? String(row.user_id) : undefined,
    enabled: Boolean(row.enabled),
  }));
}

function defaultFlagDefinitions(): FeatureFlagDefinition[] {
  return [
    { key: "commerce.enabled", defaultEnabled: true },
    { key: "erp.inventory", defaultEnabled: true },
    { key: "erp.procurement", defaultEnabled: false },
    { key: "erp.fulfilment", defaultEnabled: false },
    { key: "rinpo.ops", defaultEnabled: false },
  ];
}
