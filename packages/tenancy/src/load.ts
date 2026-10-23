import type { PermissionKey, RoleKey } from "@rinads/permissions";
import { buildTenancyContext } from "./context";
import { readActiveOrgIdFromCookie } from "./org-switch";
import { planFeatureFlags, evaluateFeatureFlags } from "./feature-flags";
import type { FeatureFlagDefinition, FeatureFlagOverrides } from "./feature-flags-types";
import type { EntitlementState, OrgMembership, TenancyContext } from "./types";

export type TenancySupabaseClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string; email?: string } | null };
      error: { message: string } | null;
    }>;
  };
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (
        col: string,
        val: string
      ) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }> & {
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
  };
};

type Row = Record<string, unknown>;

export async function loadMemberships(
  client: TenancySupabaseClient,
  userId: string
): Promise<OrgMembership[]> {
  const { data: rows, error } = await client
    .from("organization_members")
    .select("*, organizations(*), roles(*)")
    .eq("user_id", userId);

  if (error || !rows?.length) return [];

  const candidates: Array<{
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    organizationStatus: OrgMembership["organizationStatus"];
    roleKey: RoleKey;
    roleId: string;
  }> = [];

  for (const row of rows) {
    if (String(row.status ?? "") !== "active") continue;

    const org = row.organizations as Record<string, unknown> | undefined;
    const role = row.roles as Record<string, unknown> | undefined;
    if (!org || !role) continue;

    candidates.push({
      organizationId: String(org.id),
      organizationName: String(org.name),
      organizationSlug: String(org.slug),
      organizationStatus: org.status as OrgMembership["organizationStatus"],
      roleKey: String(role.key) as RoleKey,
      roleId: String(role.id),
    });
  }

  const uniqueRoleIds = [...new Set(candidates.map((c) => c.roleId))];
  const permissionEntries = await Promise.all(
    uniqueRoleIds.map(async (roleId) => [roleId, await loadRolePermissions(client, roleId)] as const)
  );
  const permissionsByRole = new Map(permissionEntries);

  return candidates.map((c) => ({
    ...c,
    permissions: permissionsByRole.get(c.roleId) ?? [],
  }));
}

async function loadRolePermissions(
  client: TenancySupabaseClient,
  roleId: string
): Promise<PermissionKey[]> {
  const { data } = await client
    .from("role_permissions")
    .select("permissions(key)")
    .eq("role_id", roleId);

  if (!data?.length) return [];
  return data
    .map((row: Row) => {
      const perm = row.permissions as { key?: string } | undefined;
      return perm?.key as PermissionKey | undefined;
    })
    .filter((k: PermissionKey | undefined): k is PermissionKey => Boolean(k));
}

function resolveTrialState(expiresAt: string | undefined, revokedAt: string | undefined): EntitlementState {
  if (!expiresAt || revokedAt) return "none";
  const expiresMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresMs)) return "none";
  const remainingMs = expiresMs - Date.now();
  if (remainingMs <= 0) return "expired_read_only";
  if (remainingMs <= 24 * 60 * 60 * 1000) return "expiring";
  return "trialing";
}

export async function loadOrgPlanAndSettings(
  client: TenancySupabaseClient,
  organizationId: string
): Promise<{
  planKey?: string;
  subscriptionStatus?: string;
  verticalKey?: string;
  entitlementState: EntitlementState;
  entitlementEndsAt?: string;
}> {
  const { data: sub } = await client
    .from("organization_subscriptions")
    .select("plan_key, status, ends_at")
    .eq("organization_id", organizationId)
    .single();

  const { data: settings } = await client
    .from("organization_settings")
    .select("vertical_key")
    .eq("organization_id", organizationId)
    .single();

  const { data: trial } = await client
    .from("trial_grants")
    .select("plan_key, expires_at, revoked_at")
    .eq("organization_id", organizationId)
    .single();

  const subscriptionStatus = sub?.status ? String(sub.status) : undefined;
  if (subscriptionStatus === "active" && sub?.plan_key) {
    return {
      planKey: String(sub.plan_key),
      subscriptionStatus,
      verticalKey: settings?.vertical_key ? String(settings.vertical_key) : undefined,
      entitlementState: "paid_active",
      entitlementEndsAt: sub?.ends_at ? String(sub.ends_at) : undefined,
    };
  }

  const trialExpiresAt = trial?.expires_at ? String(trial.expires_at) : undefined;
  const trialRevokedAt = trial?.revoked_at ? String(trial.revoked_at) : undefined;
  const entitlementState = resolveTrialState(trialExpiresAt, trialRevokedAt);
  const trialActive = entitlementState === "trialing" || entitlementState === "expiring";

  return {
    planKey: trialActive && trial?.plan_key ? String(trial.plan_key) : undefined,
    subscriptionStatus,
    verticalKey: settings?.vertical_key ? String(settings.vertical_key) : undefined,
    entitlementState,
    entitlementEndsAt: trialExpiresAt,
  };
}

export async function resolveTenancyFromSupabase(
  client: TenancySupabaseClient,
  activeOrgCookie?: string
): Promise<TenancyContext | null> {
  const { data: userData, error } = await client.auth.getUser();
  if (error || !userData.user) return null;

  const memberships = await loadMemberships(client, userData.user.id);
  if (!memberships.length) return null;

  const activeOrganizationId = readActiveOrgIdFromCookie(activeOrgCookie);
  const active =
    memberships.find(
      (m) => m.organizationId === activeOrganizationId && m.organizationStatus === "active"
    ) ??
    memberships.find((m) => m.organizationStatus === "active") ??
    memberships[0];

  const { planKey, verticalKey, entitlementState, entitlementEndsAt } = await loadOrgPlanAndSettings(
    client,
    active.organizationId
  );
  const overrides = await loadFeatureFlagOverridesForOrg(client, active.organizationId);
  const planDefaults = planFeatureFlags({ planKey, verticalKey });
  const definitions = defaultFlagDefinitions(planDefaults);
  const evaluated = evaluateFeatureFlags(definitions, overrides, {
    organizationId: active.organizationId,
    userId: userData.user.id,
  });
  const featureFlags = { ...planDefaults, ...evaluated };

  return buildTenancyContext({
    userId: userData.user.id,
    email: userData.user.email,
    activeOrganizationId: active.organizationId,
    memberships,
    planKey,
    verticalKey,
    entitlementState,
    entitlementEndsAt,
    featureFlags,
    requestId: `req_${Date.now()}`,
  });
}

export function buildDemoTenancyContext(overrides?: Partial<TenancyContext>): TenancyContext {
  const orgId = overrides?.organizationId ?? "org_ambady_demo";
  const orgStatus = overrides?.organizationStatus ?? "active";
  return {
    userId: overrides?.userId ?? "user_demo_001",
    email: overrides?.email ?? "demo@ambady.in",
    organizationId: orgId,
    organizationSlug: overrides?.organizationSlug ?? "ambady",
    organizationStatus: orgStatus,
    roleKey: overrides?.roleKey ?? "founder",
    permissions: overrides?.permissions ?? [
      "org.read",
      "org.manage",
      "commerce.catalog.read",
      "commerce.catalog.write",
      "commerce.order.read",
      "inventory.read",
      "inventory.adjust",
    ],
    memberships: overrides?.memberships ?? [
      {
        organizationId: orgId,
        organizationName: "Ambady Nursery",
        organizationSlug: "ambady",
        organizationStatus: orgStatus,
        roleKey: "founder",
        roleId: "role_founder",
        permissions: overrides?.permissions ?? [
          "org.read",
          "org.manage",
          "commerce.catalog.read",
          "commerce.catalog.write",
          "commerce.order.read",
          "inventory.read",
          "inventory.adjust",
        ],
      },
    ],
    requestId: overrides?.requestId ?? `req_${Date.now()}`,
    planKey: overrides?.planKey ?? "growth",
    verticalKey: overrides?.verticalKey ?? "ambady-nursery",
    entitlementState: overrides?.entitlementState ?? "paid_active",
    entitlementEndsAt: overrides?.entitlementEndsAt,
    featureFlags: overrides?.featureFlags ?? planFeatureFlags({ planKey: "growth" }),
  };
}

async function loadFeatureFlagOverridesForOrg(
  client: TenancySupabaseClient,
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

function defaultFlagDefinitions(planDefaults: Record<string, boolean>): FeatureFlagDefinition[] {
  return [
    { key: "commerce.enabled", defaultEnabled: planDefaults["commerce.enabled"] ?? false },
    { key: "erp.inventory", defaultEnabled: planDefaults["erp.inventory"] ?? false },
    { key: "erp.procurement", defaultEnabled: planDefaults["erp.procurement"] ?? false },
    { key: "erp.fulfilment", defaultEnabled: planDefaults["erp.fulfilment"] ?? false },
    { key: "rinpo.ops", defaultEnabled: planDefaults["rinpo.ops"] ?? false },
    {
      key: "salon.whatsapp.send_enabled",
      defaultEnabled: planDefaults["salon.whatsapp.send_enabled"] ?? false,
    },
  ];
}
