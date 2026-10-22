import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  verifyRazorpayWebhookSignature,
  mapRazorpaySubscriptionStatus,
  getRazorpayConfigFromEnv,
  rupeesToPaise,
} from "../src/providers/razorpay";
import { checkUsageLimit, recordOrderPlaced, currentPeriodStart } from "../src/usage";
import { mirrorSubscriptionToOrg } from "../src/subscriptions";
import { processRazorpayWebhook } from "../src/webhooks";

describe("Razorpay provider", () => {
  it("verifies webhook signature", () => {
    const secret = "whsec_test";
    const body = '{"event":"subscription.activated"}';
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    assert.ok(verifyRazorpayWebhookSignature(body, sig, secret));
    assert.ok(!verifyRazorpayWebhookSignature(body, "bad", secret));
  });

  it("maps subscription statuses without activating an authenticated-only mandate", () => {
    assert.equal(mapRazorpaySubscriptionStatus("active"), "active");
    assert.equal(mapRazorpaySubscriptionStatus("authenticated"), "trialing");
    assert.equal(mapRazorpaySubscriptionStatus("pending"), "past_due");
    assert.equal(mapRazorpaySubscriptionStatus("halted"), "past_due");
    assert.equal(mapRazorpaySubscriptionStatus("cancelled"), "cancelled");
    assert.equal(mapRazorpaySubscriptionStatus("unknown-provider-state"), "past_due");
  });

  it("returns null config when env missing", () => {
    const previousKey = process.env.RAZORPAY_KEY_ID;
    const previousPublicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const previousSecret = process.env.RAZORPAY_KEY_SECRET;
    const previousWebhook = process.env.RAZORPAY_WEBHOOK_SECRET;
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    assert.equal(getRazorpayConfigFromEnv(), null);
    if (previousKey) process.env.RAZORPAY_KEY_ID = previousKey;
    if (previousPublicKey) process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = previousPublicKey;
    if (previousSecret) process.env.RAZORPAY_KEY_SECRET = previousSecret;
    if (previousWebhook) process.env.RAZORPAY_WEBHOOK_SECRET = previousWebhook;
  });

  it("converts rupees to paise", () => {
    assert.equal(rupeesToPaise(4999), 499900);
    assert.equal(rupeesToPaise(10.5), 1050);
  });
});

describe("Usage metering", () => {
  it("blocks when over orders/month limit", () => {
    const orgId = "org_1";
    const period = currentPeriodStart();
    const counters = [{ organizationId: orgId, metricKey: "orders/month", periodStart: period, value: 100 }];
    const result = checkUsageLimit(counters, orgId, "ordersPerMonth", { ordersPerMonth: 100 }, 1);
    assert.equal(result.allowed, false);
  });

  it("increments order counter", () => {
    const updated = recordOrderPlaced([], "org_1");
    assert.equal(updated[0]?.value, 1);
  });
});

describe("Subscription mirror", () => {
  it("keeps provider state separate from organization entitlement state", () => {
    const rows = mirrorSubscriptionToOrg({
      organizationId: "org_1",
      planKey: "growth",
      provider: "razorpay",
      providerSubscriptionId: "sub_123",
      organizationStatus: "past_due",
      providerStatus: "halted",
    });
    assert.equal(rows.organization_subscriptions.plan_key, "growth");
    assert.equal(rows.organization_subscriptions.status, "past_due");
    assert.equal(rows.billing_subscriptions.provider_subscription_id, "sub_123");
    assert.equal(rows.billing_subscriptions.status, "halted");
  });
});

describe("Webhook handler", () => {
  it("rejects invalid signature", async () => {
    const client = {
      from: () => ({
        insert: async () => ({ error: null }),
        upsert: async () => ({ error: null }),
        select: () => ({
          eq: async () => ({ data: [], error: null }),
        }),
      }),
    };
    const result = await processRazorpayWebhook(client as never, {
      rawBody: "{}",
      signature: "bad",
      webhookSecret: "secret",
      resolveOrganizationId: async () => "org_1",
      resolvePlanKey: async () => "starter",
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, 401);
  });
});
