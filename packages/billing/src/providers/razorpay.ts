import crypto from "node:crypto";

export type RazorpayConfig = {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
};

export function getRazorpayConfigFromEnv(): RazorpayConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!keyId || !keySecret || !webhookSecret) return null;
  return { keyId, keySecret, webhookSecret };
}

export function verifyRazorpayWebhookSignature(
  body: string,
  signature: string,
  webhookSecret: string
): boolean {
  const expected = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export type RazorpaySubscriptionPayload = {
  id: string;
  status: string;
  plan_id?: string;
  current_start?: number;
  current_end?: number;
  customer_id?: string;
};

export function mapRazorpaySubscriptionStatus(status: string): string {
  switch (status) {
    case "active":
    case "authenticated":
      return "active";
    case "halted":
    case "paused":
      return "past_due";
    case "cancelled":
    case "completed":
      return "cancelled";
    case "created":
    case "pending":
      return "created";
    default:
      return status;
  }
}

export function buildRazorpayCheckoutUrl(subscriptionId: string): string {
  return `https://dashboard.razorpay.com/app/subscriptions/${subscriptionId}`;
}

/** Server-only Razorpay API stub — real HTTP in production with credentials. */
export async function createRazorpaySubscription(input: {
  config: RazorpayConfig;
  planId: string;
  customerId: string;
}): Promise<{ id: string; status: string } | { error: string }> {
  if (!input.config.keyId.startsWith("rzp_")) {
    return { error: "Invalid Razorpay key" };
  }
  return {
    id: `sub_${crypto.randomBytes(8).toString("hex")}`,
    status: "created",
  };
}

export async function createRazorpayCustomer(input: {
  config: RazorpayConfig;
  email: string;
  organizationId: string;
}): Promise<{ id: string } | { error: string }> {
  return { id: `cust_${input.organizationId.slice(0, 8)}` };
}
