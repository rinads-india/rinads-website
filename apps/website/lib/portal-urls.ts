import { getPortalUrlMap, portalUrl as joinPortalUrl, getVisiblePortalLinks } from "@rinads/auth";
import { isCustomerRoleKey, isOwnerStaffRoleKey, isPrivilegedRoleKey } from "@rinads/permissions";

export function getPortalUrls() {
  const map = getPortalUrlMap();
  return {
    owner: map.owner,
    customer: map.customer,
    platform: map.platform,
    glow: map.glow,
    website: map.website,
  } as const;
}

export function portalUrl(base: string, path: string): string {
  return joinPortalUrl(base, path);
}

export function normalizeWebsiteRoleKey(role: string): string {
  return role === "super-admin" ? "super_admin" : role;
}

export function getWebsitePortalVisibility(role: string) {
  const key = normalizeWebsiteRoleKey(role);
  return {
    privileged: isPrivilegedRoleKey(key),
    ownerStaff: isOwnerStaffRoleKey(key),
    customer: isCustomerRoleKey(key),
  };
}

export function getVisibleWebsitePortalLinks(role: string) {
  const flags = getWebsitePortalVisibility(role);
  return getVisiblePortalLinks({
    ...flags,
    urls: getPortalUrlMap(),
  });
}
