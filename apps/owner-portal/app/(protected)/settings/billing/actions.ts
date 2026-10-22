"use server";

import { redirect } from "next/navigation";
import { createOwnerServerClient } from "@/lib/supabase/server";
import { loadOwnerAccess } from "@/lib/tenancy";
import {
  getOwnerBillingPlanConfig,
  isOwnerBillingPlanKey,
} from "@/lib/billing-plans";
import {
  createOwnerRazorpaySubscription,
  getOwnerRazorpayConfigFromEnv,
} from "@/lib/razorpay-subscriptions";

const BILLING_ROLES = new Set(["owner", "founder", "admin"]);

function billingError(code: string): never {
  redirect(`/settings/billing?error=${encodeURIComponent(code)}`);
}

export async function startRazorpaySubscriptionCheckout(formData: FormData): Promise<void> {
  const planKeyRaw = String(formData.get("planKey") ?? "");
  if (!isOwnerBillingPlanKey(planKeyRaw)) {
    billingError("invalid_plan");
  }

  const access = await loadOwnerAccess(createOwnerServerClient);
  if (access.status !== "ok") {
    billingError(access.status === "unauthenticated" ? "auth_required" : "forbidden");
  }
  if (access.demo) {
    billingError("demo_mode");
  }
  if (!BILLING_ROLES.has(access.tenancy.roleKey.toLowerCase())) {
    billingError("owner_required");
  }

  const configuredPlan = getOwnerBillingPlanConfig(planKeyRaw);
  if (!configuredPlan.ok) {
    billingError(configuredPlan.error);
  }

  const razorpayConfig = getOwnerRazorpayConfigFromEnv();
  if (!razorpayConfig) {
    billingError("razorpay_not_configured");
  }

  const result = await createOwnerRazorpaySubscription({
    config: razorpayConfig,
    planId: configuredPlan.planId,
    totalCount: configuredPlan.totalCount,
    notes: {
      organization_id: access.tenancy.organizationId,
      plan_key: planKeyRaw,
      source: "rinads-owner-portal",
    },
  });

  if (!result.ok) {
    billingError("provider_error");
  }

  redirect(result.shortUrl);
}
