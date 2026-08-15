"use server";

import { createPlatformServiceClient } from "@/lib/supabase/server";
import { requirePlatformTenancy } from "@/lib/tenancy";
import { isDemoMode } from "@/lib/supabase/env";
import { planFeatureFlags } from "@rinads/tenancy";

const FLAG_KEYS = [
  "commerce.enabled",
  "erp.inventory",
  "erp.procurement",
  "erp.fulfilment",
  "rinpo.ops",
] as const;

export async function listTenantFlagsAction(organizationId: string): Promise<
  | { ok: true; flags: { key: string; enabled: boolean; source: "plan" | "override" }[] }
  | { ok: false; error: string }
> {
  try {
    await requirePlatformTenancy();
    const planDefaults = planFeatureFlags({ planKey: "growth" });

    if (isDemoMode()) {
      return {
        ok: true,
        flags: FLAG_KEYS.map((key) => ({
          key,
          enabled: planDefaults[key] ?? false,
          source: "plan" as const,
        })),
      };
    }

    const service = createPlatformServiceClient();
    const { data: overrides } = await (
      service as unknown as {
        from: (table: string) => {
          select: (cols: string) => {
            eq: (col: string, val: string) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
          };
        };
      }
    )
      .from("feature_flag_overrides")
      .select("flag_key, enabled")
      .eq("organization_id", organizationId);

    const overrideMap = new Map((overrides ?? []).map((o) => [String(o.flag_key), Boolean(o.enabled)]));

    return {
      ok: true,
      flags: FLAG_KEYS.map((key) => ({
        key,
        enabled: overrideMap.get(key) ?? planDefaults[key] ?? false,
        source: overrideMap.has(key) ? ("override" as const) : ("plan" as const),
      })),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}

export async function setTenantFlagOverrideAction(
  organizationId: string,
  flagKey: string,
  enabled: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requirePlatformTenancy();
    if (isDemoMode()) return { ok: true };

    const service = createPlatformServiceClient();
    const { error } = await (
      service.from("feature_flag_overrides") as unknown as {
        upsert: (rows: Record<string, unknown>[]) => Promise<{ error: { message: string } | null }>;
      }
    ).upsert([
      {
        organization_id: organizationId,
        flag_key: flagKey,
        enabled,
      },
    ]);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unexpected error" };
  }
}
