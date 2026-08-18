import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveTemplateForBusinessType,
  ONBOARDING_MODULES,
} from "../lib/onboarding-config";
import {
  getOsRinpoPrompts,
  resolveOsModuleFromParam,
  getGreetingForHour,
} from "../lib/os-rinpo-prompts";

describe("onboarding-config", () => {
  it("maps landscape business type to ambady-nursery template", () => {
    assert.equal(resolveTemplateForBusinessType("landscape"), "ambady-nursery");
    assert.equal(resolveTemplateForBusinessType("retail"), "generic-retail");
  });

  it("defines six onboarding modules", () => {
    assert.equal(ONBOARDING_MODULES.length, 6);
  });
});

describe("os-rinpo-prompts", () => {
  it("returns contextual prompts for dashboard module", () => {
    const prompts = getOsRinpoPrompts("dashboard");
    assert.ok(prompts[0]?.includes("focus"));
    assert.equal(prompts.length, 3);
  });

  it("resolves module query param", () => {
    assert.equal(resolveOsModuleFromParam("leads"), "leads");
    assert.equal(resolveOsModuleFromParam("invalid"), "dashboard");
  });

  it("returns time-based greeting", () => {
    assert.match(getGreetingForHour(new Date("2026-01-01T09:00:00")), /Good morning/);
    assert.match(getGreetingForHour(new Date("2026-01-01T14:00:00")), /Good afternoon/);
    assert.match(getGreetingForHour(new Date("2026-01-01T20:00:00")), /Good evening/);
  });
});
