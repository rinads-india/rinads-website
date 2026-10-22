import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseRinadsOrderReadInput } from "../lib/agent-gateway/order-read";

const ORDER_ID = "7e6f0a1b-2c3d-4e5f-8a9b-0c1d2e3f4a5b";

describe("RINADS agent order read input policy", () => {
  it("accepts one tenant-owned order UUID argument", () => {
    assert.deepEqual(parseRinadsOrderReadInput({ order_id: ORDER_ID }), {
      ok: true,
      orderId: ORDER_ID,
    });
  });

  it("rejects a caller-supplied organization_id", () => {
    const parsed = parseRinadsOrderReadInput({
      order_id: ORDER_ID,
      organization_id: "org_attacker_selected",
    });

    assert.equal(parsed.ok, false);
    if (!parsed.ok) assert.match(parsed.reason, /organization_id/);
  });

  it("rejects missing, empty and malformed order identifiers", () => {
    assert.equal(parseRinadsOrderReadInput({}).ok, false);
    assert.equal(parseRinadsOrderReadInput({ order_id: "" }).ok, false);
    assert.equal(parseRinadsOrderReadInput({ order_id: "not-a-uuid" }).ok, false);
  });

  it("rejects undeclared arguments", () => {
    const parsed = parseRinadsOrderReadInput({
      order_id: ORDER_ID,
      include_payments: true,
    });

    assert.equal(parsed.ok, false);
    if (!parsed.ok) assert.match(parsed.reason, /include_payments/);
  });
});
