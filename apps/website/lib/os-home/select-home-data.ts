import type { AttentionItem, OsHomeData, RinpoDailyBriefData } from "@/lib/os-home/types";
import { getDemoOsHomeData } from "@/lib/os-home/demo/business-os-home";
import { loadLiveWorkspaceStatus } from "@/lib/os-home/loaders/workspace-status";
import { loadLiveAttentionItems } from "@/lib/os-home/loaders/attention";
import { loadLivePulseMetrics } from "@/lib/os-home/loaders/pulse";
import { loadLiveContinueWorking } from "@/lib/os-home/loaders/continue-working";
import { loadLiveRooms } from "@/lib/os-home/loaders/rooms";
import { isSupabaseMode } from "@/lib/supabase/env";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { requireOsShellAccess } from "@/lib/os-shell-access";
import type { PermissionKey } from "@rinads/permissions";

export function buildLiveBrief(attention: AttentionItem[]): RinpoDailyBriefData {
  const attentionCount = attention.reduce((sum, item) => sum + item.count, 0);
  const recommendations = attention.slice(0, 3).map((item) => ({
    id: `brief-${item.id}`,
    text: `${item.label} (${item.count})`,
    kind: "recommendation" as const,
    href: item.href,
    source: "live" as const,
  }));

  return {
    summary:
      attentionCount > 0
        ? `${attention.length} areas need your attention (${attentionCount} items).`
        : "Nothing urgent from supported operational sources right now.",
    attentionCount,
    recommendations,
    source: "live",
  };
}

/**
 * Select Home command-centre data.
 * Demo auth → tagged demo adapter only.
 * Live Supabase → RLS loaders; empty sections stay empty (never fall back to demo metrics).
 */
export async function selectOsHomeData(): Promise<OsHomeData> {
  if (!isSupabaseMode()) {
    return getDemoOsHomeData();
  }

  const access = await requireOsShellAccess("/os");
  const active = access.organizationId
    ? access.memberships.find((m) => m.organizationId === access.organizationId)
    : access.memberships[0];

  const workspace = loadLiveWorkspaceStatus({
    memberships: access.memberships,
    organizationId: access.organizationId,
    roleKey: access.roleKey,
  });

  if (!access.organizationId) {
    return {
      workspace,
      attention: [],
      brief: buildLiveBrief([]),
      pulse: [],
      continueWorking: [],
      rooms: [],
      liveAttempted: true,
      errors: {},
    };
  }

  const client = await createWebsiteServerClient();
  const permissions = (active?.permissions ?? []) as PermissionKey[];
  const errors: OsHomeData["errors"] = {};

  let attention: AttentionItem[] = [];
  try {
    attention = await loadLiveAttentionItems({
      client: client as never,
      organizationId: access.organizationId,
      roleKey: access.roleKey,
      permissions,
    });
  } catch (e) {
    errors.attention = e instanceof Error ? e.message : "Attention unavailable";
  }

  let pulse: OsHomeData["pulse"] = [];
  try {
    pulse = await loadLivePulseMetrics({
      client: client as never,
      organizationId: access.organizationId,
      roleKey: access.roleKey,
      permissions,
    });
  } catch (e) {
    errors.pulse = e instanceof Error ? e.message : "Pulse unavailable";
  }

  let continueWorking: OsHomeData["continueWorking"] = [];
  try {
    continueWorking = await loadLiveContinueWorking({
      client: client as never,
      organizationId: access.organizationId,
    });
  } catch (e) {
    errors.continueWorking = e instanceof Error ? e.message : "Recent work unavailable";
  }

  let rooms: OsHomeData["rooms"] = [];
  try {
    rooms = await loadLiveRooms();
  } catch (e) {
    errors.rooms = e instanceof Error ? e.message : "Rooms unavailable";
  }

  return {
    workspace,
    attention,
    brief: buildLiveBrief(attention),
    pulse,
    continueWorking,
    rooms,
    liveAttempted: true,
    errors,
  };
}
