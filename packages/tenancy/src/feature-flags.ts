import type { FeatureFlagDefinition, FeatureFlagOverrides } from "./feature-flags-types";

export function evaluateFeatureFlags(
  definitions: FeatureFlagDefinition[],
  overrides: FeatureFlagOverrides,
  context: { organizationId?: string; userId?: string }
): Record<string, boolean> {
  const result: Record<string, boolean> = {};

  for (const def of definitions) {
    const orgOverride = overrides.find(
      (o) => o.flagKey === def.key && o.organizationId === context.organizationId
    );
    const userOverride = overrides.find(
      (o) => o.flagKey === def.key && o.userId === context.userId
    );
    result[def.key] = userOverride?.enabled ?? orgOverride?.enabled ?? def.defaultEnabled;
  }

  return result;
}

export function isModuleEnabled(
  flags: Record<string, boolean>,
  moduleKey: string
): boolean {
  return flags[`erp.${moduleKey}`] ?? flags[`commerce.${moduleKey}`] ?? flags[moduleKey] ?? true;
}

/** Plan-based defaults when DB flag rows are unavailable (demo / partial Supabase). */
export function planFeatureFlags(input: {
  planKey?: string;
  verticalKey?: string;
}): Record<string, boolean> {
  const modules =
    input.planKey === "starter"
      ? ["commerce", "inventory"]
      : input.planKey === "platform"
        ? ["commerce", "inventory", "procurement", "fulfilment", "crm", "tasks"]
        : ["commerce", "inventory", "procurement", "fulfilment"];

  const flags: Record<string, boolean> = {
    "commerce.enabled": modules.includes("commerce"),
    "erp.inventory": modules.includes("inventory"),
    "erp.procurement": modules.includes("procurement"),
    "erp.fulfilment": modules.includes("fulfilment"),
    "rinpo.ops": input.planKey === "platform",
  };
  return flags;
}
