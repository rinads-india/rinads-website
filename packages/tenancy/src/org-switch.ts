import type { TenancyContext } from "./types";
import { ACTIVE_ORG_COOKIE } from "./types";

export function readActiveOrgIdFromCookie(cookieValue?: string): string | undefined {
  const v = cookieValue?.trim();
  return v || undefined;
}

export function activeOrgCookieOptions(
  orgId: string,
  scope?: { domain?: string; secure?: boolean }
) {
  return {
    name: ACTIVE_ORG_COOKIE,
    value: orgId,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    ...(scope?.domain ? { domain: scope.domain } : {}),
    ...(scope?.secure !== undefined ? { secure: scope.secure } : {}),
  };
}

export function pickMembershipForSwitch(
  tenancy: TenancyContext,
  organizationId: string
): boolean {
  return tenancy.memberships.some(
    (m) => m.organizationId === organizationId && m.organizationStatus === "active"
  );
}
