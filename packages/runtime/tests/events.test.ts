import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { emitEvent, maskEventPayload } from "../src/events/emit";
import { createMemoryRuntimeStore } from "../src/store/memory-store";
import { newCorrelationId } from "../src/events/types";

describe("Runtime events v1", () => {
  it("deduplicates by idempotency key", () => {
    const store = createMemoryRuntimeStore();
    const e1 = emitEvent(store, {
      organizationId: "org_a",
      eventType: "order.paid.v1",
      aggregateType: "order",
      aggregateId: "o1",
      payload: { orderId: "o1" },
      idempotencyKey: "order.paid:o1",
    });
    const e2 = emitEvent(store, {
      organizationId: "org_a",
      eventType: "order.paid.v1",
      aggregateType: "order",
      aggregateId: "o1",
      payload: { orderId: "o1" },
      idempotencyKey: "order.paid:o1",
    });
    assert.equal(e1.id, e2.id);
    assert.equal(store.events.length, 1);
  });

  it("preserves correlation_id across emit", () => {
    const store = createMemoryRuntimeStore();
    const correlationId = newCorrelationId("order");
    const paid = emitEvent(store, {
      organizationId: "org_a",
      eventType: "order.paid.v1",
      aggregateType: "order",
      aggregateId: "o1",
      payload: { orderId: "o1" },
      correlationId,
    });
    assert.equal(paid.correlationId, correlationId);
  });

  it("masks sensitive payload fields", () => {
    const store = createMemoryRuntimeStore();
    const event = emitEvent(store, {
      organizationId: "org_a",
      eventType: "payment.confirmed.v1",
      aggregateType: "payment",
      aggregateId: "p1",
      payload: { email: "a@b.com", amount: 100 },
    });
    const masked = maskEventPayload(event);
    assert.equal(masked.payload.email, "[redacted]");
    assert.equal(masked.payload.amount, 100);
  });
});
