import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildRGlowRazorpayOrderNotes, evaluateRGlowActivationEvent } from "../src/index";

const notes = {
  organizationId: "org_salon_1",
  planKey: "growth",
  verticalKey: "salon-os" as const,
  purchaseIntentId: "intent_1",
};

describe("R GLOW activation payment gate", () => {
  it("accepts only captured/paid server-side events with activation metadata", () => {
    assert.equal(evaluateRGlowActivationEvent({ eventType: "payment.captured", paymentStatus: "captured", currency: "INR", notes }).activate, true);
    assert.equal(evaluateRGlowActivationEvent({ eventType: "order.paid", orderStatus: "paid", currency: "INR", notes }).activate, true);
    assert.equal(evaluateRGlowActivationEvent({ eventType: "checkout.success", notes }).activate, false);
  });

  it("fails closed when metadata or payment state is incomplete", () => {
    assert.deepEqual(evaluateRGlowActivationEvent({ eventType: "payment.captured", paymentStatus: "failed", notes }), {
      activate: false,
      reason: "payment_not_captured",
    });
    assert.deepEqual(evaluateRGlowActivationEvent({ eventType: "payment.captured", paymentStatus: "captured" }), {
      activate: false,
      reason: "activation_metadata_missing",
    });
  });

  it("builds provider order notes without claiming a subscription", () => {
    assert.deepEqual(buildRGlowRazorpayOrderNotes(notes), {
      organization_id: "org_salon_1",
      plan_key: "growth",
      vertical_key: "salon-os",
      purchase_intent_id: "intent_1",
    });
  });
});
