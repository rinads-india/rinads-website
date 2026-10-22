import crypto from "node:crypto";

export type RazorpayConfig = {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
};

export function getRazorpayConfigFromEnv(): RazorpayConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!keyId || !keySecret || !webhookSecret) return null;
  return { keyId, keySecret, webhookSecret };
}

export type RazorpayCheckoutConfig = {
  keyId: string;
  keySecret: string;
};

/** Checkout/API credentials (webhook secret not required). */
export function getRazorpayCheckoutConfigFromEnv(): RazorpayCheckoutConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

export function rupeesToPaise(amountInr: number): number {
  return Math.round(amountInr * 100);
}

type RazorpayApiErrorPayload = {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
  };
};

function isValidRazorpayConfig(config: RazorpayCheckoutConfig): boolean {
  return config.keyId.startsWith("rzp_") && config.keySecret.trim().length > 0;
}

async function razorpayPost<T>(
  config: RazorpayCheckoutConfig,
  path: string,
  body: Record<string, unknown>,
): Promise<T | { error: string }> {
  if (!isValidRazorpayConfig(config)) {
    return { error: "Invalid Razorpay credentials" };
  }

  const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");

  let response: Response;
  try {
    response = await fetch(`https://api.razorpay.com${path}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { error: "Razorpay API request failed" };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { error: `Razorpay API returned an invalid response (${response.status})` };
  }

  if (!response.ok) {
    const apiError = payload as RazorpayApiErrorPayload;
    return {
      error:
        apiError.error?.description ??
        apiError.error?.reason ??
        `Razorpay API request failed (${response.status})`,
    };
  }

  return payload as T;
}

export type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
};

/** Create a one-time Razorpay order (Services checkout). */
export async function createRazorpayOrder(input: {
  config: RazorpayCheckoutConfig;
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResponse | { error: string }> {
  if (input.amountPaise < 100) {
    return { error: "Amount must be at least ₹1" };
  }

  const payload = await razorpayPost<RazorpayOrderResponse>(input.config, "/v1/orders", {
    amount: input.amountPaise,
    currency: input.currency ?? "INR",
    receipt: input.receipt.slice(0, 40),
    notes: input.notes ?? {},
  });

  if ("error" in payload) return payload;
  if (!payload.id) return { error: "Razorpay order id missing" };
  return payload;
}

export function verifyRazorpayWebhookSignature(
  body: string,
  signature: string,
  webhookSecret: string,
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
  short_url?: string;
  total_count?: number;
  paid_count?: number;
  remaining_count?: number;
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
    case "expired":
      return "cancelled";
    case "created":
    case "pending":
      return "created";
    default:
      return status;
  }
}

/** Razorpay Dashboard management URL. This is not the customer authorization URL. */
export function buildRazorpayCheckoutUrl(subscriptionId: string): string {
  return `https://dashboard.razorpay.com/app/subscriptions/${subscriptionId}`;
}

export type RazorpaySubscriptionResponse = {
  id: string;
  status: string;
  planId: string;
  shortUrl?: string;
  customerId?: string;
  totalCount?: number;
};

/**
 * Creates a real Razorpay Subscription via POST /v1/subscriptions.
 * Customer authorization happens through the returned shortUrl; Razorpay populates
 * customer_id after successful authorization.
 */
export async function createRazorpaySubscription(input: {
  config: RazorpayCheckoutConfig;
  planId: string;
  totalCount: number;
  quantity?: number;
  customerNotify?: boolean;
  startAt?: number;
  expireBy?: number;
  notes?: Record<string, string>;
}): Promise<RazorpaySubscriptionResponse | { error: string }> {
  if (!input.planId.startsWith("plan_")) {
    return { error: "Invalid Razorpay plan id" };
  }
  if (!Number.isInteger(input.totalCount) || input.totalCount < 1) {
    return { error: "totalCount must be a positive integer" };
  }
  const quantity = input.quantity ?? 1;
  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: "quantity must be a positive integer" };
  }

  const body: Record<string, unknown> = {
    plan_id: input.planId,
    total_count: input.totalCount,
    quantity,
    customer_notify: input.customerNotify ?? false,
    notes: input.notes ?? {},
  };
  if (input.startAt !== undefined) body.start_at = input.startAt;
  if (input.expireBy !== undefined) body.expire_by = input.expireBy;

  const payload = await razorpayPost<RazorpaySubscriptionPayload>(
    input.config,
    "/v1/subscriptions",
    body,
  );
  if ("error" in payload) return payload;
  if (!payload.id) return { error: "Razorpay subscription id missing" };

  return {
    id: payload.id,
    status: payload.status,
    planId: payload.plan_id ?? input.planId,
    shortUrl: payload.short_url,
    customerId: payload.customer_id,
    totalCount: payload.total_count,
  };
}

export type RazorpayCustomerResponse = {
  id: string;
  name?: string;
  email?: string;
  contact?: string;
};

/** Create or reuse a Razorpay Customer via POST /v1/customers. */
export async function createRazorpayCustomer(input: {
  config: RazorpayCheckoutConfig;
  email: string;
  organizationId: string;
  name?: string;
  contact?: string;
}): Promise<RazorpayCustomerResponse | { error: string }> {
  if (!input.email.includes("@")) {
    return { error: "A valid customer email is required" };
  }
  if (!input.organizationId.trim()) {
    return { error: "organizationId is required" };
  }

  const body: Record<string, unknown> = {
    email: input.email.trim().slice(0, 64),
    fail_existing: "0",
    notes: {
      organization_id: input.organizationId.slice(0, 256),
    },
  };
  if (input.name?.trim()) body.name = input.name.trim().slice(0, 50);
  if (input.contact?.trim()) body.contact = input.contact.trim().slice(0, 15);

  const payload = await razorpayPost<RazorpayCustomerResponse>(
    input.config,
    "/v1/customers",
    body,
  );
  if ("error" in payload) return payload;
  if (!payload.id) return { error: "Razorpay customer id missing" };
  return payload;
}
