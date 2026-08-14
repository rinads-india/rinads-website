import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { roundMoney } from "../src/result";
import { PaymentService } from "../src/services/payment";

describe("PaymentService", () => {
  it("rejects missing reference", () => {
    const svc = new PaymentService();
    const result = svc.verify({ provider: "demo", reference: "", amount: 100, currency: "INR" });
    assert.ok(!result.ok);
  });

  it("simulates failure with fail_ prefix", () => {
    const svc = new PaymentService();
    const result = svc.verify({ provider: "demo", reference: "fail_123", amount: 100, currency: "INR" });
    assert.ok(result.ok);
    assert.equal(result.data.status, "failed");
  });
});

describe("roundMoney", () => {
  it("rounds to two decimals", () => {
    assert.equal(roundMoney(10.556), 10.56);
  });
});
