import { mapRazorpaySubscriptionStatus, type RazorpaySubscriptionPayload } from "./providers/razorpay";

export type SubscriptionMirrorInput = {
  organizationId: string;
  planKey: string;
  provider: "razorpay" | "stripe";
  providerSubscriptionId: string;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
};

export function mirrorSubscriptionToOrg(input: SubscriptionMirrorInput): {
  organization_subscriptions: Record<string, unknown>;
  billing_subscriptions: Record<string, unknown>;
} {
  return {
    organization_subscriptions: {
      organization_id: input.organizationId,
      plan_key: input.planKey,
      status: input.status === "active" ? "active" : input.status,
      updated_at: new Date().toISOString(),
    },
    billing_subscriptions: {
      organization_id: input.organizationId,
      provider: input.provider,
      provider_subscription_id: input.providerSubscriptionId,
      plan_key: input.planKey,
      status: input.status,
      current_period_start: input.currentPeriodStart ?? null,
      current_period_end: input.currentPeriodEnd ?? null,
      updated_at: new Date().toISOString(),
    },
  };
}

export function subscriptionFromRazorpayWebhook(
  organizationId: string,
  planKey: string,
  payload: RazorpaySubscriptionPayload
): SubscriptionMirrorInput {
  return {
    organizationId,
    planKey,
    provider: "razorpay",
    providerSubscriptionId: payload.id,
    status: mapRazorpaySubscriptionStatus(payload.status),
    currentPeriodStart: payload.current_start
      ? new Date(payload.current_start * 1000).toISOString()
      : undefined,
    currentPeriodEnd: payload.current_end
      ? new Date(payload.current_end * 1000).toISOString()
      : undefined,
  };
}
