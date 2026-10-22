import "server-only";

export type OwnerBillingPlanKey = "starter" | "growth" | "platform";

export type OwnerBillingPlanDisplay = {
  key: OwnerBillingPlanKey;
  label: string;
  description: string;
  configured: boolean;
};

type OwnerBillingPlanDefinition = {
  key: OwnerBillingPlanKey;
  label: string;
  description: string;
  planIdEnv: string;
  totalCountEnv: string;
};

const OWNER_BILLING_PLAN_DEFINITIONS: readonly OwnerBillingPlanDefinition[] = [
  {
    key: "starter",
    label: "Starter",
    description: "Core RINADS operating workspace for small teams.",
    planIdEnv: "RAZORPAY_PLAN_STARTER_ID",
    totalCountEnv: "RAZORPAY_PLAN_STARTER_TOTAL_COUNT",
  },
  {
    key: "growth",
    label: "Growth",
    description: "Expanded growth, automation and operating capabilities.",
    planIdEnv: "RAZORPAY_PLAN_GROWTH_ID",
    totalCountEnv: "RAZORPAY_PLAN_GROWTH_TOTAL_COUNT",
  },
  {
    key: "platform",
    label: "Platform",
    description: "Full platform capability for advanced organizations.",
    planIdEnv: "RAZORPAY_PLAN_PLATFORM_ID",
    totalCountEnv: "RAZORPAY_PLAN_PLATFORM_TOTAL_COUNT",
  },
] as const;

export function isOwnerBillingPlanKey(value: string): value is OwnerBillingPlanKey {
  return OWNER_BILLING_PLAN_DEFINITIONS.some((plan) => plan.key === value);
}

export function getOwnerBillingPlanDisplays(): OwnerBillingPlanDisplay[] {
  return OWNER_BILLING_PLAN_DEFINITIONS.map((plan) => ({
    key: plan.key,
    label: plan.label,
    description: plan.description,
    configured: Boolean(process.env[plan.planIdEnv] && process.env[plan.totalCountEnv]),
  }));
}

export function getOwnerBillingPlanConfig(planKey: OwnerBillingPlanKey):
  | { ok: true; planId: string; totalCount: number }
  | { ok: false; error: "plan_not_configured" | "invalid_total_count" } {
  const definition = OWNER_BILLING_PLAN_DEFINITIONS.find((plan) => plan.key === planKey);
  if (!definition) return { ok: false, error: "plan_not_configured" };

  const planId = process.env[definition.planIdEnv]?.trim();
  const totalCountRaw = process.env[definition.totalCountEnv]?.trim();
  if (!planId || !totalCountRaw) {
    return { ok: false, error: "plan_not_configured" };
  }

  const totalCount = Number(totalCountRaw);
  if (!Number.isInteger(totalCount) || totalCount < 1) {
    return { ok: false, error: "invalid_total_count" };
  }

  return { ok: true, planId, totalCount };
}
