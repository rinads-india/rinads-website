import {
  loadMemberships,
  type OrgMembership,
  type TenancySupabaseClient,
} from "@rinads/tenancy";
import {
  resolveActiveOrganizationId,
  resolveTenantAwareDestination,
  type OrganizationRoutingSettings,
} from "./post-auth-destination";
import { isProductionDeployment } from "./auth-cookie-config";

type SettingsClient = TenancySupabaseClient;

export async function loadOrganizationRoutingSettings(
  client: SettingsClient,
  organizationId: string
): Promise<OrganizationRoutingSettings> {
  const { data } = await client
    .from("organization_settings")
    .select("vertical_key, business_type")
    .eq("organization_id", organizationId)
    .single();
  return {
    verticalKey: data?.vertical_key ? String(data.vertical_key) : undefined,
    businessType: data?.business_type ? String(data.business_type) : undefined,
  };
}

export async function resolveDestinationForMemberships(
  client: SettingsClient,
  memberships: OrgMembership[],
  activeOrgCookie?: string | null
): Promise<string> {
  const organizationId = resolveActiveOrganizationId(memberships, activeOrgCookie);
  const settingsByOrganizationId: Record<string, OrganizationRoutingSettings> = {};
  if (organizationId) {
    settingsByOrganizationId[organizationId] =
      await loadOrganizationRoutingSettings(client, organizationId);
  }
  return resolveTenantAwareDestination({
    memberships,
    activeOrgCookie,
    settingsByOrganizationId,
    rinaglowUrl: process.env.NEXT_PUBLIC_RINAGLOW_URL,
    production: isProductionDeployment(),
    authCookieDomain: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN,
  });
}

export async function loadAndResolveUserDestination(
  client: TenancySupabaseClient,
  userId: string,
  activeOrgCookie?: string | null
): Promise<{ destination: string; memberships: OrgMembership[] }> {
  const memberships = await loadMemberships(client, userId);
  return {
    destination: await resolveDestinationForMemberships(
      client,
      memberships,
      activeOrgCookie
    ),
    memberships,
  };
}
