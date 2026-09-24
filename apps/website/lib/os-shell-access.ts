import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACTIVE_ORG_COOKIE,
  loadMemberships,
  type OrgMembership,
  type TenancySupabaseClient,
} from "@rinads/tenancy";
import type { RoleKey } from "@rinads/permissions";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";
import { ensureActiveOrganizationCookieAction } from "@/lib/org-context";
import { resolveDestinationForMemberships } from "@/lib/tenant-destination-server";
import {
  ONBOARDING_PATH,
  OS_PATH,
  resolveActiveOrganizationId,
  sanitizeNextPath,
} from "@/lib/post-auth-destination";

export type OsShellAccessResult = {
  /** True when Supabase mode ran the full membership gate. */
  enforced: boolean;
  memberships: OrgMembership[];
  /** Trusted org role for the active organisation, or null when unresolved. */
  roleKey: RoleKey | null;
  organizationId: string | null;
};

/**
 * Allow only same-origin relative paths under Business OS / onboarding.
 * Prevents open redirects via login `next` (blocks //, http:, protocol-relative).
 */
export function sanitizeOsLoginNext(next: string | null | undefined): string {
  const safe = sanitizeNextPath(next);
  if (!safe) return OS_PATH;
  const path = safe.split("?")[0] ?? safe;
  if (path === OS_PATH || path.startsWith(`${OS_PATH}/`)) return safe;
  if (path === ONBOARDING_PATH || path.startsWith(`${ONBOARDING_PATH}/`)) return safe;
  return OS_PATH;
}

export async function readOsRequestPathname(): Promise<string> {
  const h = await headers();
  const fromMiddleware = h.get("x-rinads-pathname");
  if (fromMiddleware && fromMiddleware.startsWith("/")) {
    return fromMiddleware.split("?")[0] || OS_PATH;
  }
  return OS_PATH;
}

/**
 * Shared Business OS access resolver for every `/os/*` route.
 * Preserves onboarding + salon→Rinaglow destination behaviour.
 * Does not mutate schema/RLS/auth architecture.
 */
export async function requireOsShellAccess(
  requestedPath?: string
): Promise<OsShellAccessResult> {
  if (!isSupabaseMode()) {
    return {
      enforced: false,
      memberships: [],
      roleKey: null,
      organizationId: null,
    };
  }

  const pathname = requestedPath ?? (await readOsRequestPathname());
  const loginNext = sanitizeOsLoginNext(pathname);

  const supabase = await createWebsiteServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect(`/signup?mode=login&next=${encodeURIComponent(loginNext)}`);
  }

  const memberships = await loadMemberships(
    supabase as unknown as TenancySupabaseClient,
    data.user.id
  );

  await ensureActiveOrganizationCookieAction();
  const activeOrgCookie = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;

  const destination = await resolveDestinationForMemberships(
    supabase as unknown as TenancySupabaseClient,
    memberships,
    activeOrgCookie
  );

  if (destination !== OS_PATH) {
    redirect(destination);
  }

  const organizationId =
    resolveActiveOrganizationId(
      memberships.map((m) => ({
        organizationId: m.organizationId,
        organizationStatus: m.organizationStatus,
      })),
      activeOrgCookie
    ) ?? null;

  const activeMembership = organizationId
    ? memberships.find((m) => m.organizationId === organizationId)
    : undefined;

  return {
    enforced: true,
    memberships,
    roleKey: activeMembership?.roleKey ?? null,
    organizationId,
  };
}
