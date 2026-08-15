import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { planIncludesModule } from "@rinads/platform";

describe("platform-admin smoke", () => {
  it("plan module gate works for growth plan", () => {
    assert.equal(planIncludesModule({ modules: ["commerce", "inventory", "procurement"] }, "fulfilment"), false);
    assert.equal(planIncludesModule({ modules: ["commerce", "inventory", "procurement", "fulfilment"] }, "fulfilment"), true);
  });
});
