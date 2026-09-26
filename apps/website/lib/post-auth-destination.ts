export { sanitizeRelativeNext as sanitizeNextPath } from "@rinads/auth";

export const OS_PATH = "/os";
export const ONBOARDING_PATH = "/onboarding/create-organization";
export const SALON_CALENDAR_PATH = "/calendar";

export type DestinationMembership = {
  organizationId: string;
  organizationStatus: "active" | "suspended" | "archived";
};

export type OrganizationRoutingSettings = {
  verticalKey?: string | null;
  businessType?: string | null;
};

export type TenantDestinationInput = {
  memberships: DestinationMembership[];
  activeOrgCookie?: string | null;
  settingsByOrganizationId: Record<string, OrganizationRoutingSettings | undefined>;
  rinaglowUrl?: string | null;
  production?: boolean;
  authCookieDomain?: string | null;
};

export function getDemoPostAuthPath(): string {
  return OS_PATH;
}

export function resolveActiveOrganizationId(
  memberships: DestinationMembership[],
  activeOrgCookie?: string | null
): string | undefined {
  const activeMemberships = memberships.filter(
    (membership) => membership.organizationStatus === "active"
  );
  const cookieOrganizationId = activeOrgCookie?.trim();
  if (
    cookieOrganizationId &&
    activeMemberships.some(
      (membership) => membership.organizationId === cookieOrganizationId
    )
  ) {
    return cookieOrganizationId;
  }
  return activeMemberships.length === 1
    ? activeMemberships[0]?.organizationId
    : undefined;
}

export function isSalonOrganization(
  settings: OrganizationRoutingSettings | undefined
): boolean {
  return (
    settings?.verticalKey === "salon-os" ||
    // Transitional fallback while the repair migration rolls out.
    settings?.businessType === "salon"
  );
}

export function resolveRinaglowOrigin(input: {
  value?: string | null;
  production?: boolean;
  authCookieDomain?: string | null;
}): string | undefined {
  if (!input.value) return undefined;
  try {
    const url = new URL(input.value);
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
      return undefined;
    }

    const isRinadsHost =
      url.hostname === "rinads.com" || url.hostname.endsWith(".rinads.com");
    if (input.production) {
      if (
        url.protocol !== "https:" ||
        !isRinadsHost ||
        input.authCookieDomain !== ".rinads.com"
      ) {
        return undefined;
      }
    } else {
      const isLocalhost =
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "[::1]";
      if (!(url.protocol === "https:" && isRinadsHost) && !isLocalhost) {
        return undefined;
      }
      if (isLocalhost && url.protocol !== "http:" && url.protocol !== "https:") {
        return undefined;
      }
    }
    return url.origin;
  } catch {
    return undefined;
  }
}

export function resolveTenantAwareDestination(input: TenantDestinationInput): string {
  if (input.memberships.length === 0) return ONBOARDING_PATH;

  const organizationId = resolveActiveOrganizationId(
    input.memberships,
    input.activeOrgCookie
  );
  if (!organizationId) return OS_PATH;

  if (!isSalonOrganization(input.settingsByOrganizationId[organizationId])) {
    return OS_PATH;
  }

  const rinaglowOrigin = resolveRinaglowOrigin({
    value: input.rinaglowUrl,
    production: input.production,
    authCookieDomain: input.authCookieDomain,
  });
  return rinaglowOrigin ? `${rinaglowOrigin}${SALON_CALENDAR_PATH}` : OS_PATH;
}
