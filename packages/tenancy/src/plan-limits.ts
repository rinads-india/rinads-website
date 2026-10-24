import type { TenancyContext } from "./types";
import { isModuleEnabled } from "./feature-flags";

export type PlanLimits = {
  modules?: string[];
  seats?: number;
  ordersPerMonth?: number;
};

export type PlanModuleCheckResult =
  | { allowed: true }
  | { allowed: false; reason: string; upgradeRequired?: boolean };

function planIncludesModule(planLimits: PlanLimits, module: string): boolean {
  const modules = planLimits.modules;
  // Entitlements are security-sensitive. Missing, malformed or empty module
  // manifests must never grant access implicitly.
  if (!Array.isArray(modules) || modules.length === 0) return false;
  return modules.includes(module);
}

export function requirePlanModule(
  tenancy: TenancyContext,
  moduleKey: string,
  planLimits?: PlanLimits
): PlanModuleCheckResult {
  if (tenancy.organizationStatus === "suspended") {
    return { allowed: false, reason: "Organization is suspended." };
  }
  if (tenancy.organizationStatus === "archived") {
    return { allowed: false, reason: "Organization is archived." };
  }

  if (!tenancy.planKey && !planLimits) {
    return {
      allowed: false,
      reason: "No active plan or trial entitlement is available for this organization.",
      upgradeRequired: true,
    };
  }

  const limits = planLimits ?? defaultLimitsForPlan(tenancy.planKey);
  if (!planIncludesModule(limits, moduleKey)) {
    return {
      allowed: false,
      reason: `Module "${moduleKey}" is not included in your ${tenancy.planKey ?? "current"} entitlement.`,
      upgradeRequired: true,
    };
  }

  if (tenancy.featureFlags && !isModuleEnabled(tenancy.featureFlags, moduleKey)) {
    return {
      allowed: false,
      reason: `Module "${moduleKey}" is disabled for this organization.`,
      upgradeRequired: true,
    };
  }

  return { allowed: true };
}

function defaultLimitsForPlan(planKey?: string): PlanLimits {
  switch (planKey) {
    case "starter":
      return { modules: ["commerce", "inventory"], seats: 5, ordersPerMonth: 100 };
    case "trial-starter":
      return { modules: ["commerce", "inventory", "crm", "tasks"], seats: 3, ordersPerMonth: 100 };
    case "growth":
      return {
        modules: ["commerce", "inventory", "procurement", "fulfilment"],
        seats: 25,
        ordersPerMonth: 1000,
      };
    case "platform":
      return {
        modules: ["commerce", "inventory", "procurement", "fulfilment", "crm", "tasks"],
        seats: 100,
        ordersPerMonth: 10000,
      };
    default:
      return { modules: [] };
  }
}

export function assertPlanModule(tenancy: TenancyContext, moduleKey: string): void {
  const result = requirePlanModule(tenancy, moduleKey);
  if (!result.allowed) {
    throw new Error(result.reason);
  }
}
