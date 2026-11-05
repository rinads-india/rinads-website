import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateMerchantDeliveryRead, evaluateDriverOfferRead } from "../src/shipping/read-access";

const merchant = {
  enabled: true,
  authenticated: true,
  isDemo: false,
  organizationActive: true,
  hasLogisticsReadPermission: true,
};

describe("RI DELIVERY preview read gates", () => {
  it("fails closed when the product is disabled", () => {
    assert.deepEqual(evaluateMerchantDeliveryRead({ ...merchant, enabled: false }), {
      allowed: false, status: 503, code: "FEATURE_NOT_LIVE",
    });
  });
  it("refuses to expose real data in demo mode", () => {
    assert.equal(evaluateMerchantDeliveryRead({ ...merchant, isDemo: true }).status, 503);
  });
  it("requires authenticated staff", () => {
    assert.equal(evaluateMerchantDeliveryRead({ ...merchant, authenticated: false }).status, 401);
  });
  it("denies archived and suspended tenants", () => {
    assert.equal(evaluateMerchantDeliveryRead({ ...merchant, organizationActive: false }).status, 403);
  });
  it("denies staff without logistics.read", () => {
    assert.equal(evaluateMerchantDeliveryRead({ ...merchant, hasLogisticsReadPermission: false }).status, 403);
  });
  it("permits read only after all merchant gates", () => {
    assert.deepEqual(evaluateMerchantDeliveryRead(merchant), { allowed: true, status: 200, code: "OK" });
  });
  it("driver offers route defaults off", () => {
    assert.equal(evaluateDriverOfferRead({ enabled: false, authenticated: true, anonymousUser: false }).status, 503);
  });
  it("rejects anonymous Supabase identities", () => {
    assert.equal(evaluateDriverOfferRead({ enabled: true, authenticated: true, anonymousUser: true }).status, 401);
  });
  it("rejects missing driver identity", () => {
    assert.equal(evaluateDriverOfferRead({ enabled: true, authenticated: false, anonymousUser: false }).status, 401);
  });
  it("driver route only passes after verified auth; RLS still required", () => {
    assert.equal(evaluateDriverOfferRead({ enabled: true, authenticated: true, anonymousUser: false }).allowed, true);
  });
});
