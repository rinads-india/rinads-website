import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rinpoGreeting, rinpoGuidance } from "../lib/rinpo-welcome";
import { migrateLegacyStatus, fromLegacyAvailability, PRODUCT_STATUS_VALUES } from "../lib/product-status";
import { isAvailable, isLive, PLATFORM_AVAILABILITY } from "../lib/availability";

describe("truthful public readiness", () => {
  it("preserves every canonical status while keeping legacy vertical availability as pilot", () => {
    for (const status of PRODUCT_STATUS_VALUES) assert.equal(migrateLegacyStatus(status), status);
    assert.equal(fromLegacyAvailability("available"), "pilot");
    assert.equal(migrateLegacyStatus("available_configuration"), "pilot");
    assert.equal(migrateLegacyStatus("prototype_demo"), "preview");
    assert.equal(migrateLegacyStatus("unknown"), "roadmap");
  });

  it("does not equate preview routes or configured providers with live availability", () => {
    for (const key of Object.keys(PLATFORM_AVAILABILITY) as Array<keyof typeof PLATFORM_AVAILABILITY>) {
      assert.equal(isLive(key), isAvailable(key));
      if (PLATFORM_AVAILABILITY[key] !== "AVAILABLE") assert.equal(isLive(key), false);
    }
    assert.equal(isLive("payment_checkout"), false);
    assert.equal(isLive("whatsapp_notify"), false);
  });

  it("does not use stored names as evidence of authentication", () => {
    assert.equal(rinpoGreeting(false, "Andrino"), "Welcome to RINADS. What would you like to do?");
    assert.equal(rinpoGreeting(true, "Guest"), rinpoGreeting(false, "Guest"));
    assert.equal(rinpoGreeting(true, "  "), rinpoGreeting(false, "Guest"));
    assert.equal(rinpoGreeting(true, " Andrino "), "Hello Andrino! What would you like to work on?");
  });

  it("offers role-specific next steps without fabricated activity or loaded-data claims", () => {
    for (const role of ["client", "staff", "visitor"]) {
      for (const favourites of [[], ["AI Automation"], ["Digital Marketing"]]) {
        const guidance = rinpoGuidance(role, favourites);
        assert.ok(guidance.length > 20);
        assert.doesNotMatch(guidance, /\d|all milestones|routing is active|loaded|guarantee/i);
      }
    }
    assert.match(rinpoGuidance("client", []), /client workspace/);
    assert.match(rinpoGuidance("staff", []), /assigned work/);
  });
});
