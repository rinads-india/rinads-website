export type StripeConfig = {
  secretKey: string;
  webhookSecret: string;
};

export function getStripeConfigFromEnv(): StripeConfig | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) return null;
  return { secretKey, webhookSecret };
}

export async function createStripeSubscription(): Promise<never> {
  throw new Error("NOT_IMPLEMENTED: Stripe billing adapter deferred to Phase 13");
}

export async function createStripeCustomer(): Promise<never> {
  throw new Error("NOT_IMPLEMENTED: Stripe billing adapter deferred to Phase 13");
}

export function verifyStripeWebhookSignature(): never {
  throw new Error("NOT_IMPLEMENTED: Stripe billing adapter deferred to Phase 13");
}
