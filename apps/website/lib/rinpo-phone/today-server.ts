import "server-only";

import { createWebsiteServerClient } from "@/lib/supabase/server";
import type { RinpoPhoneAccessResult } from "./access";
import {
  RINPO_TODAY_OPEN_TASK_STATUSES,
  buildRinpoTodayFromCounts,
  canReadRinpoToday,
  type RinpoTodayResult,
} from "./today";

type AuthenticatedPhoneAccess = Extract<
  RinpoPhoneAccessResult,
  { status: "authenticated" }
>;

/**
 * A read-only, authenticated and member-scoped summary of the first two
 * supported tenant data domains. RLS remains the database authority.
 *
 * No service-role key, client-provided organization ID, LLM request, write,
 * public chat endpoint, or demo-data fallback is used.
 */
export async function loadRinpoPhoneToday(
  access: AuthenticatedPhoneAccess,
): Promise<RinpoTodayResult> {
  const organizationId = access.organizationId;
  if (!organizationId) return { status: "no_organization", source: "none" };
  if (!canReadRinpoToday({
    organizationId,
    roleKey: access.roleKey,
    permissions: access.homeInput.permissionIds,
  })) {
    return { status: "restricted", source: "none" };
  }

  try {
    const supabase = await createWebsiteServerClient();
    const { data: identity, error: authError } = await supabase.auth.getUser();
    if (authError || !identity.user || identity.user.id !== access.userId) {
      return { status: "unavailable", source: "none" };
    }

    const [customers, tasks] = await Promise.all([
      supabase
        .from("cos_contacts")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("cos_tasks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .in("status", [...RINPO_TODAY_OPEN_TASK_STATUSES]),
    ]);

    return buildRinpoTodayFromCounts(customers, tasks);
  } catch {
    return { status: "unavailable", source: "none" };
  }
}
