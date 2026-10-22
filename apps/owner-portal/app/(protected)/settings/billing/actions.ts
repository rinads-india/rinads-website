"use server";

import { createRazorpaySubscription, getRazorpayCheckoutConfigFromEnv } from "@rinads/billing";
import { redirect } from "next/navigation";
import { createOwnerServerClient } from "@/lib/supabase/server";
import { loadOwnerAccess } from "@/lib/tenancy";
import {
  getOwnerBillingPlanConfig,
  isOwnerBillingPlanKey,
} from "@/lib/billing-plans";

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

  const razorpayConfig = getRazorpayCheckoutConfigFromEnv();
  if (!razorpayConfig) {
    billingError("razorpay_not_configured");
  }

  const result = await createRazorpaySubscription({
    config: razorpayConfig,
    planId: configuredPlan.planId,
    totalCount: configuredPlan.totalCount,
    customerNotify: false,
    notes: {
      organization_id: access.tenancy.organizationId,
      plan_key: planKeyRaw,
      source: "rinads-owner-portal",
    },
  });

  if ("error" in result) {
    billingError("provider_error");
  }
  if (!result.shortUrl) {
    billingError("authorization_url_missing");
  }

  redirect(result.shortUrl);
}
