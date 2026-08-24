"use server";

import { cookies } from "next/headers";
import {
  ACTIVE_ORG_COOKIE,
  activeOrgCookieOptions,
  loadMemberships,
  type TenancySupabaseClient,
} from "@rinads/tenancy";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";

export async function setActiveOrganizationAction(
  organizationId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseMode()) {
    return { ok: false, error: "Supabase Auth is not enabled" };
  }

  const orgId = organizationId.trim();
  if (!orgId) return { ok: false, error: "Organization id is required" };

  try {
    const supabase = await createWebsiteServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { ok: false, error: "Not authenticated" };
    }

    const memberships = await loadMemberships(
      supabase as unknown as TenancySupabaseClient,
      user.id
    );
    const allowed = memberships.some(
      (m) => m.organizationId === orgId && m.organizationStatus === "active"
    );
    if (!allowed) {
      return { ok: false, error: "You are not a member of this organization" };
    }

    const cookieStore = await cookies();
    const opts = activeOrgCookieOptions(orgId);
    cookieStore.set(opts.name, opts.value, {
      httpOnly: opts.httpOnly,
      sameSite: opts.sameSite,
      path: opts.path,
      maxAge: opts.maxAge,
    });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

/** Set active org cookie when user has exactly one active membership and none is selected. */
export async function ensureActiveOrganizationCookieAction(): Promise<
  { ok: true; organizationId?: string; set: boolean } | { ok: false }
> {
  if (!isSupabaseMode()) return { ok: false };

  try {
    const cookieStore = await cookies();
    const existing = cookieStore.get(ACTIVE_ORG_COOKIE)?.value?.trim();
    if (existing) return { ok: true, organizationId: existing, set: false };

    const supabase = await createWebsiteServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return { ok: false };

    const memberships = await loadMemberships(
      supabase as unknown as TenancySupabaseClient,
      user.id
    );
    const activeMemberships = memberships.filter((m) => m.organizationStatus === "active");
    if (activeMemberships.length !== 1) return { ok: true, set: false };

    const orgId = activeMemberships[0]!.organizationId;
    const opts = activeOrgCookieOptions(orgId);
    cookieStore.set(opts.name, opts.value, {
      httpOnly: opts.httpOnly,
      sameSite: opts.sameSite,
      path: opts.path,
      maxAge: opts.maxAge,
    });

    return { ok: true, organizationId: orgId, set: true };
  } catch {
    return { ok: false };
  }
}
