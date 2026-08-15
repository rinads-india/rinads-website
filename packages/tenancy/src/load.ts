import type { PermissionKey, RoleKey } from "@rinads/permissions";
import { buildTenancyContext } from "./context";
import { readActiveOrgIdFromCookie } from "./org-switch";
import { planFeatureFlags, evaluateFeatureFlags } from "./feature-flags";
import type { FeatureFlagDefinition, FeatureFlagOverrides } from "./feature-flags-types";
import type { OrgMembership, TenancyContext } from "./types";

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

  const memberships: OrgMembership[] = [];
  for (const row of rows) {
    const org = row.organizations as Record<string, unknown> | undefined;
    const role = row.roles as Record<string, unknown> | undefined;
    if (!org || !role) continue;

    const roleKey = String(role.key) as RoleKey;
    const permissions = await loadRolePermissions(client, String(role.id));

    memberships.push({
      organizationId: String(org.id),
      organizationName: String(org.name),
      organizationSlug: String(org.slug),
      organizationStatus: org.status as OrgMembership["organizationStatus"],
      roleKey,
      roleId: String(role.id),
      permissions,
    });
  }
  return memberships;
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

export async function loadOrgPlanAndSettings(
  client: TenancySupabaseClient,
  organizationId: string
): Promise<{ planKey?: string; verticalKey?: string }> {
  const { data: sub } = await client
    .from("organization_subscriptions")
    .select("plan_key")
    .eq("organization_id", organizationId)
    .single();

  const { data: settings } = await client
    .from("organization_settings")
    .select("vertical_key")
    .eq("organization_id", organizationId)
    .single();

  return {
    planKey: sub?.plan_key ? String(sub.plan_key) : undefined,
    verticalKey: settings?.vertical_key ? String(settings.vertical_key) : undefined,
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
    memberships.find((m) => m.organizationId === activeOrganizationId) ?? memberships[0];

  const { planKey, verticalKey } = await loadOrgPlanAndSettings(client, active.organizationId);
  const overrides = await loadFeatureFlagOverridesForOrg(client, active.organizationId);
  const definitions = defaultFlagDefinitions();
  const evaluated = evaluateFeatureFlags(definitions, overrides, {
    organizationId: active.organizationId,
    userId: userData.user.id,
  });
  const featureFlags = { ...planFeatureFlags({ planKey, verticalKey }), ...evaluated };

  return buildTenancyContext({
    userId: userData.user.id,
    email: userData.user.email,
    activeOrganizationId: active.organizationId,
    memberships,
    planKey,
    verticalKey,
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

function defaultFlagDefinitions(): FeatureFlagDefinition[] {
  return [
    { key: "commerce.enabled", defaultEnabled: true },
    { key: "erp.inventory", defaultEnabled: true },
    { key: "erp.procurement", defaultEnabled: false },
    { key: "erp.fulfilment", defaultEnabled: false },
    { key: "rinpo.ops", defaultEnabled: false },
  ];
}
