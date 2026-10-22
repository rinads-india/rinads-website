export type RGlowActivationNotes = {
  organizationId: string;
  planKey: string;
  verticalKey: "salon-os";
  purchaseIntentId: string;
};

export type RazorpayActivationEvent = {
  eventType: string;
  paymentStatus?: string;
  orderStatus?: string;
  amount?: number;
  currency?: string;
  notes?: Partial<RGlowActivationNotes>;
};

export type ActivationDecision =
  | { activate: true; notes: RGlowActivationNotes }
  | {
      activate: false;
      reason:
        | "unsupported_event"
        | "payment_not_captured"
        | "order_not_paid"
        | "invalid_currency"
        | "activation_metadata_missing";
    };

function hasActivationNotes(notes?: Partial<RGlowActivationNotes>): notes is RGlowActivationNotes {
  return Boolean(
    notes?.organizationId &&
      notes?.planKey &&
      notes?.verticalKey === "salon-os" &&
      notes?.purchaseIntentId,
  );
}

/**
 * Browser checkout success is intentionally insufficient. Only a verified server-side
 * Razorpay webhook should call this helper after signature verification.
 */
export function evaluateRGlowActivationEvent(event: RazorpayActivationEvent): ActivationDecision {
  if (!hasActivationNotes(event.notes)) return { activate: false, reason: "activation_metadata_missing" };
  if (event.currency && event.currency !== "INR") return { activate: false, reason: "invalid_currency" };

  if (event.eventType === "payment.captured") {
    if (event.paymentStatus && event.paymentStatus !== "captured") {
      return { activate: false, reason: "payment_not_captured" };
    }
    return { activate: true, notes: event.notes };
  }

  if (event.eventType === "order.paid") {
    if (event.orderStatus && event.orderStatus !== "paid") {
      return { activate: false, reason: "order_not_paid" };
    }
    return { activate: true, notes: event.notes };
  }

  return { activate: false, reason: "unsupported_event" };
}

export function buildRGlowRazorpayOrderNotes(input: RGlowActivationNotes): Record<string, string> {
  if (!hasActivationNotes(input)) throw new Error("RGLOW_ACTIVATION_METADATA_REQUIRED");
  return {
    organization_id: input.organizationId,
    plan_key: input.planKey,
    vertical_key: input.verticalKey,
    purchase_intent_id: input.purchaseIntentId,
  };
}
