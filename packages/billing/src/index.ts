export type BillingProvider = "razorpay" | "stripe";

export type BillingCustomer = {
  id: string;
  organizationId: string;
  provider: BillingProvider;
  providerCustomerId: string;
  email?: string;
};

export type BillingSubscription = {
  id: string;
  organizationId: string;
  provider: BillingProvider;
  providerSubscriptionId: string;
  planKey: string;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
};

export type BillingWebhookEvent = {
  eventType: string;
  idempotencyKey: string;
  organizationId?: string;
  payload: Record<string, unknown>;
};

export type PlanLimits = {
  modules?: string[];
  seats?: number;
  ordersPerMonth?: number;
};

export * from "./providers/razorpay";
export * from "./providers/stripe";
export * from "./subscriptions";
export * from "./usage";
export * from "./webhooks";
