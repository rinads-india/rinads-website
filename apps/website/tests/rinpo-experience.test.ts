import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getRinpoPageContext,
  RINPO_STATE_LABELS,
  type RinpoExperienceState,
} from "../lib/rinpo-experience";

describe("RINPO public experience context", () => {
  it("returns Business prompts on the Business route", () => {
    const context = getRinpoPageContext("/platform/business");
    assert.equal(context.area, "Business");
    assert.ok(context.suggestions.some((item) => item.toLowerCase().includes("lead")));
  });

  it("returns RI LABS context for RI LABS and legacy Academy routes", () => {
    const context = getRinpoPageContext("/labs");
    assert.equal(context.area, "RI LABS");
    assert.equal(getRinpoPageContext("/academy/ai").area, "RI LABS");
    assert.ok(context.suggestions.length >= 3);
  });

  it("enriches industry solution routes with edition context", () => {
    const context = getRinpoPageContext("/solutions/jewellery");
    assert.equal(context.industry, "jewellery");
    assert.ok(context.productHints?.length);
    assert.match(context.prompt, /jewellery|RINADS/i);
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
