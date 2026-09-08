import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DeterministicRinpoNluAdapter } from "../src/nlu-deterministic";
import type { RinpoNluContext } from "../src/nlu-types";
import type { AttentionItem } from "@rinads/salon";

const adapter = new DeterministicRinpoNluAdapter();

const baseCtx: RinpoNluContext = { organizationId: "org_1" };

function attentionItem(kind: AttentionItem["kind"], title: string): AttentionItem {
  return {
    kind,
    title,
    description: title,
    count: 1,
    impact: 50,
    urgency: 50,
    confidence: 0.9,
    reversible: true,
    score: 50,
  };
}

describe("DeterministicRinpoNluAdapter — business summary", () => {
  it('"what needs attention" triggers get_salon_business_summary', () => {
    const intent = adapter.parse("What needs attention right now?", baseCtx);
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls.length, 1);
    assert.equal(intent.calls[0].tool, "get_salon_business_summary");
  });

  it('"check R GLOW" also triggers the business summary', () => {
    const intent = adapter.parse("Check R GLOW for me", baseCtx);
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls[0].tool, "get_salon_business_summary");
  });
});

describe("DeterministicRinpoNluAdapter — do the first N", () => {
  const items = [
    attentionItem("pending_payments", "Pending payments"),
    attentionItem("unconfirmed_bookings", "Unconfirmed bookings"),
    attentionItem("reactivation_candidates", "Customers going quiet"),
  ];

  it('"do the first three" resolves via lastAttentionItems context', () => {
    const ctx: RinpoNluContext = { ...baseCtx, lastAttentionItems: items };
    const intent = adapter.parse("Do the first three", ctx);
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls.length, 3);
    assert.equal(intent.calls[0].tool, "get_pending_payments");
    assert.equal(intent.calls[1].tool, "get_today_appointments");
    assert.equal(intent.calls[2].tool, "create_reactivation_campaign");
  });

  it('"do the first two" only resolves the first two items', () => {
    const ctx: RinpoNluContext = { ...baseCtx, lastAttentionItems: items };
    const intent = adapter.parse("do the first two", ctx);
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls.length, 2);
  });

  it('"do all" resolves every cached item', () => {
    const ctx: RinpoNluContext = { ...baseCtx, lastAttentionItems: items };
    const intent = adapter.parse("do all of them", ctx);
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls.length, 3);
  });

  it("clarifies when there is no cached attention list to act on", () => {
    const intent = adapter.parse("Do the first three", baseCtx);
    assert.equal(intent.kind, "clarify");
  });

  it("resolves empty_slots_today follow-up using the context's defaultBranchId", () => {
    const ctx: RinpoNluContext = {
      ...baseCtx,
      defaultBranchId: "branch_1",
      lastAttentionItems: [attentionItem("empty_slots_today", "Empty slots today")],
    };
    const intent = adapter.parse("do the first one", ctx);
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls[0].tool, "get_empty_slots");
    assert.equal(intent.calls[0].args.branchId, "branch_1");
  });
});

describe("DeterministicRinpoNluAdapter — clarification branches", () => {
  it("asks which branch when checking empty slots without a default branch", () => {
    const intent = adapter.parse("Show me empty slots today", baseCtx);
    assert.equal(intent.kind, "clarify");
  });

  it("resolves empty slots directly when a default branch is present", () => {
    const intent = adapter.parse("Show me empty slots today", { ...baseCtx, defaultBranchId: "branch_1" });
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls[0].tool, "get_empty_slots");
  });

  it("asks which customer when checking history without a selected customer", () => {
    const intent = adapter.parse("Show me the customer history", baseCtx);
    assert.equal(intent.kind, "clarify");
  });

  it("resolves customer history from a UUID embedded in the text", () => {
    const intent = adapter.parse("Show me the client history for 11111111-1111-1111-1111-111111111111", baseCtx);
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls[0].tool, "get_customer_history");
    assert.equal(intent.calls[0].args.customerId, "11111111-1111-1111-1111-111111111111");
  });

  it("resolves customer history from the selected customer in context", () => {
    const intent = adapter.parse("Show me the customer history", { ...baseCtx, selectedCustomerId: "cust_9" });
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls[0].args.customerId, "cust_9");
  });

  it("asks which appointment to cancel when nothing is selected or referenced", () => {
    const intent = adapter.parse("Cancel this appointment", baseCtx);
    assert.equal(intent.kind, "clarify");
  });

  it("asks for both appointment and time when rescheduling is underspecified", () => {
    const intent = adapter.parse("Reschedule the appointment", { ...baseCtx, selectedAppointmentId: "appt_1" });
    assert.equal(intent.kind, "clarify");
  });

  it("falls back to a generic clarification for unrecognized input", () => {
    const intent = adapter.parse("blah blah nonsense", baseCtx);
    assert.equal(intent.kind, "clarify");
  });
});

describe("DeterministicRinpoNluAdapter — text extraction", () => {
  const saleId = "22222222-2222-2222-2222-222222222222";
  const serviceId = "33333333-3333-3333-3333-333333333333";

  it("extracts saleId, method, and amount for record_payment", () => {
    const intent = adapter.parse(`Record a cash payment of 500 for ${saleId}`, baseCtx);
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls[0].tool, "record_payment");
    assert.equal(intent.calls[0].args.saleId, saleId);
    assert.equal(intent.calls[0].args.method, "cash");
    assert.equal(intent.calls[0].args.amount, 500);
  });

  it("falls back to the context's selectedSaleId for record_payment", () => {
    const intent = adapter.parse("Record a upi payment of 250", { ...baseCtx, selectedSaleId: "sale_9" });
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls[0].args.saleId, "sale_9");
    assert.equal(intent.calls[0].args.amount, 250);
  });

  it("clarifies record_payment when the amount cannot be parsed", () => {
    const intent = adapter.parse("Record a cash payment", { ...baseCtx, selectedSaleId: "sale_1" });
    assert.equal(intent.kind, "clarify");
  });

  it("extracts saleId, amount, and reason for initiate_refund", () => {
    const intent = adapter.parse(`Refund 300 on ${saleId} because the customer was unhappy`, baseCtx);
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls[0].tool, "initiate_refund");
    assert.equal(intent.calls[0].args.saleId, saleId);
    assert.equal(intent.calls[0].args.amount, 300);
    assert.equal(intent.calls[0].args.reason, "the customer was unhappy");
  });

  it("extracts serviceId and newPrice for modify_pricing", () => {
    const intent = adapter.parse(`Change the price of ${serviceId} to 999`, baseCtx);
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls[0].tool, "modify_pricing");
    assert.equal(intent.calls[0].args.serviceId, serviceId);
    assert.equal(intent.calls[0].args.newPrice, 999);
  });

  it("clarifies modify_pricing when the new price cannot be parsed", () => {
    const intent = adapter.parse(`Update the price of ${serviceId}`, baseCtx);
    assert.equal(intent.kind, "clarify");
  });

  it("extracts saleLineId and discountAmount for modify_discount", () => {
    const intent = adapter.parse(`Apply a discount of 50 to ${saleId}`, baseCtx);
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls[0].tool, "modify_discount");
    assert.equal(intent.calls[0].args.saleLineId, saleId);
    assert.equal(intent.calls[0].args.discountAmount, 50);
  });

  it("extracts daysInactive from reactivation phrasing", () => {
    const intent = adapter.parse("Which customers haven't booked in the last 60 days?", baseCtx);
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls[0].tool, "get_reactivation_candidates");
    assert.equal(intent.calls[0].args.daysInactive, 60);
  });

  it("defaults daysInactive to 45 when unspecified", () => {
    const intent = adapter.parse("Show me reactivation candidates", baseCtx);
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls[0].args.daysInactive, 45);
  });

  it("extracts days from revenue phrasing", () => {
    const intent = adapter.parse("What was our revenue in the last 7 days?", baseCtx);
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls[0].tool, "get_revenue_summary");
    assert.equal(intent.calls[0].args.days, 7);
  });

  it("extracts a reschedule target appointment and ISO time", () => {
    const intent = adapter.parse("Reschedule this appointment to 2026-09-10T14:00", { ...baseCtx, selectedAppointmentId: "appt_1" });
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls[0].tool, "reschedule_appointment");
    assert.equal(intent.calls[0].args.appointmentId, "appt_1");
    assert.equal(intent.calls[0].args.newStartsAt, "2026-09-10T14:00");
  });

  it("extracts a cancellation reason", () => {
    const intent = adapter.parse("Cancel this appointment because the customer called in sick", {
      ...baseCtx,
      selectedAppointmentId: "appt_1",
    });
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind !== "tool_calls") return;
    assert.equal(intent.calls[0].args.reason, "the customer called in sick");
  });
});
