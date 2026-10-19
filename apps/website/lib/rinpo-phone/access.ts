import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import {
  ACTIVE_ORG_COOKIE,
  loadMemberships,
  type OrgMembership,
  type TenancySupabaseClient,
} from "@rinads/tenancy";
import { isCustomerRoleKey, type RoleKey } from "@rinads/permissions";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";
import { ensureActiveOrganizationCookieAction } from "@/lib/org-context";
import { resolveActiveOrganizationId } from "@/lib/post-auth-destination";
import type { RinpoPhoneHomeInput } from "./home";

export type RinpoPhoneAccessResult =
  | {
      status: "authenticated";
      userId: string;
      memberships: OrgMembership[];
      organizationId: string | null;
      organizationName: string | null;
      roleKey: RoleKey | null;
      homeInput: RinpoPhoneHomeInput;
    }
  | { status: "unauthenticated" }
  | { status: "unavailable"; reason: string };

/**
 * Resolves the current authenticated Phone workspace without introducing
 * parallel auth, tenancy or device persistence.
 *
 * M1a deliberately uses an unregistered web-device marker and an auth-backed
 * provisional RINPO id. Persistent RINPO IDs/devices remain blocked on the
 * Company OS/security schema reconciliation.
 */
export async function resolveRinpoPhoneAccess(): Promise<RinpoPhoneAccessResult> {
  if (!isSupabaseMode()) {
    return {
      status: "unavailable",
      reason: "RINPO Phone requires Supabase authentication in this environment.",
    };
  }

  const supabase = await createWebsiteServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { status: "unauthenticated" };

  const memberships = await loadMemberships(
    supabase as unknown as TenancySupabaseClient,
    data.user.id,
  );

  await ensureActiveOrganizationCookieAction();
  const activeOrgCookie = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value;
  const organizationId =
    resolveActiveOrganizationId(
      memberships.map((membership) => ({
        organizationId: membership.organizationId,
        organizationStatus: membership.organizationStatus,
      })),
      activeOrgCookie,
    ) ?? null;

  const membership = organizationId
    ? memberships.find(
        (candidate) =>
          candidate.organizationId === organizationId &&
          candidate.organizationStatus === "active",
      )
    : undefined;

  const roleKey = membership?.roleKey ?? null;
  const workspaceType = membership
    ? isCustomerRoleKey(membership.roleKey)
      ? "client"
      : "organisation"
    : "personal";

  const requestId = randomUUID();
  const sessionId = randomUUID();

  return {
    status: "authenticated",
    userId: data.user.id,
    memberships,
    organizationId,
    organizationName: membership?.organizationName ?? null,
    roleKey,
    homeInput: {
      userId: data.user.id,
      // Provisional auth-backed identity only; not a persisted public RINPO ID.
      rinpoId: `auth:${data.user.id}`,
      workspaceId: membership ? `org:${membership.organizationId}` : `personal:${data.user.id}`,
      workspaceType,
      tenantId: membership?.organizationId ?? null,
      roleIds: roleKey ? [roleKey] : [],
      permissionIds: membership?.permissions.map(String) ?? [],
      planId: null,
      deviceId: "web:unregistered",
      platform: "web",
      requestId,
      sessionId,
    },
  };
}
