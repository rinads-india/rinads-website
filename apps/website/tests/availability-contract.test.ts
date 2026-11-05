import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PLATFORM_AVAILABILITY,
  isAvailable,
  isLive,
  getCapabilityStatus,
  type CapabilityKey,
} from "../lib/availability";

describe("public capability truth for Founding Access", () => {
  it("never labels preview or private-preview features as live", () => {
    for (const key of Object.keys(PLATFORM_AVAILABILITY) as CapabilityKey[]) {
      assert.equal(isLive(key), isAvailable(key), key);
      assert.equal(isAvailable(key), getCapabilityStatus(key) === "AVAILABLE", key);
    }
    assert.equal(isLive("rinpo_intelligence"), false);
    assert.equal(isLive("ri_marketplace"), false);
  });

  it("keeps unverified external money and messaging workflows off the live list", () => {
    assert.equal(getCapabilityStatus("payment_checkout"), "PREVIEW");
    assert.equal(getCapabilityStatus("whatsapp_notify"), "PREVIEW");
    assert.equal(isLive("payment_checkout"), false);
    assert.equal(isLive("whatsapp_notify"), false);
  });
});
