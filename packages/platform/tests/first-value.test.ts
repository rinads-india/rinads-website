import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateFirstValueEvent, type FirstValueDefinition } from "../src/index";

const definition: FirstValueDefinition = {
  productKey: "ri-salon-rinaverse",
  eventKey: "appointment.invoiced",
  version: "1",
  description: "First completed appointment with an invoice.",
  requiredProperties: ["appointment_id", "invoice_id"],
};

const event = {
  organizationId: "org_1",
  productKey: "ri-salon-rinaverse",
  eventKey: "appointment.invoiced",
  definitionVersion: "1",
  occurredAt: "2026-10-22T04:30:00.000Z",
  source: "system" as const,
  idempotencyKey: "org_1:appointment.invoiced:apt_1",
  properties: {
    appointment_id: "apt_1",
    invoice_id: "inv_1",
  },
};

describe("first-value activation", () => {
  it("marks a matching tenant-scoped event as first value", () => {
    assert.deepEqual(evaluateFirstValueEvent(event, definition), {
      achieved: true,
      organizationId: "org_1",
      productKey: "ri-salon-rinaverse",
      eventKey: "appointment.invoiced",
    });
  });

  it("fails closed for missing required business evidence", () => {
    assert.deepEqual(
      evaluateFirstValueEvent(
        { ...event, properties: { appointment_id: "apt_1" } },
        definition,
      ),
      { achieved: false, reason: "required_property_missing" },
    );
  });

  it("rejects mismatched product definitions and invalid event time", () => {
    assert.deepEqual(
      evaluateFirstValueEvent({ ...event, productKey: "other-product" }, definition),
      { achieved: false, reason: "definition_mismatch" },
    );

    assert.deepEqual(
      evaluateFirstValueEvent({ ...event, occurredAt: "not-a-date" }, definition),
      { achieved: false, reason: "event_time_invalid" },
    );
  });

  it("requires idempotency so retries cannot create duplicate activation credit", () => {
    assert.deepEqual(
      evaluateFirstValueEvent({ ...event, idempotencyKey: "" }, definition),
      { achieved: false, reason: "idempotency_key_missing" },
    );
  });
});
