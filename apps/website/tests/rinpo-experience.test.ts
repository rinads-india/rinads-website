import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getRinpoPageContext,
  RINPO_STATE_LABELS,
  type RinpoExperienceState,
} from "../lib/rinpo-experience";

describe("RINPO public experience context", () => {
  it("returns Business OS prompts on the Business OS route", () => {
    const context = getRinpoPageContext("/platform/business-os");
    assert.equal(context.area, "Business OS");
    assert.ok(context.suggestions.some((item) => item.toLowerCase().includes("lead")));
  });

  it("returns Academy context for Academy routes", () => {
    const context = getRinpoPageContext("/academy/ai");
    assert.equal(context.area, "Academy");
    assert.ok(context.suggestions.length >= 3);
  });

  it("keeps industry solution guidance generic across vertical routes", () => {
    const context = getRinpoPageContext("/solutions/jewellery");
    assert.equal(context.area, "Industry Solutions");
    assert.match(context.prompt, /industry/i);
  });

  it("falls back to the RINADS context for unknown public routes", () => {
    const context = getRinpoPageContext("/something-new");
    assert.equal(context.area, "RINADS");
    assert.ok(context.suggestions.includes("Build something"));
  });

  it("defines a display label for every interaction state", () => {
    const states: RinpoExperienceState[] = [
      "closed",
      "open",
      "listening",
      "thinking",
      "responding",
      "recommending",
      "action-preview",
      "awaiting-approval",
      "executing",
      "success",
      "failure",
      "audited",
    ];

    for (const state of states) {
      assert.ok(RINPO_STATE_LABELS[state].length > 0);
    }
  });
});
