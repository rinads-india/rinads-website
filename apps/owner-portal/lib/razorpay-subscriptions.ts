import "server-only";

export type OwnerRazorpayConfig = {
  keyId: string;
  keySecret: string;
};

export function getOwnerRazorpayConfigFromEnv(): OwnerRazorpayConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || !keyId.startsWith("rzp_")) return null;
  return { keyId, keySecret };
}

export async function createOwnerRazorpaySubscription(input: {
  config: OwnerRazorpayConfig;
  planId: string;
  totalCount: number;
  notes: Record<string, string>;
}): Promise<
  | { ok: true; id: string; status: string; shortUrl: string }
  | { ok: false; error: string }
> {
  if (!input.planId.startsWith("plan_")) {
    return { ok: false, error: "invalid_plan_id" };
  }
  if (!Number.isInteger(input.totalCount) || input.totalCount < 1) {
    return { ok: false, error: "invalid_total_count" };
  }

  const auth = Buffer.from(`${input.config.keyId}:${input.config.keySecret}`).toString("base64");
  let response: Response;
  try {
    response = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: input.planId,
        total_count: input.totalCount,
        quantity: 1,
        customer_notify: false,
        notes: input.notes,
      }),
    });
  } catch {
    return { ok: false, error: "provider_unreachable" };
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "provider_invalid_response" };
  }

  if (!response.ok) {
    return { ok: false, error: "provider_error" };
  }

  const id = typeof payload.id === "string" ? payload.id : "";
  const status = typeof payload.status === "string" ? payload.status : "";
  const shortUrl = typeof payload.short_url === "string" ? payload.short_url : "";
  if (!id || !status || !shortUrl) {
    return { ok: false, error: "provider_incomplete_response" };
  }

  return { ok: true, id, status, shortUrl };
}
