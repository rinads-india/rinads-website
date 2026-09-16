import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseVerticalTemplateKey, planIncludesModule } from "@rinads/platform";

describe("platform-admin smoke", () => {
  it("plan module gate works for growth plan", () => {
    assert.equal(planIncludesModule({ modules: ["commerce", "inventory", "procurement"] }, "fulfilment"), false);
    assert.equal(planIncludesModule({ modules: ["commerce", "inventory", "procurement", "fulfilment"] }, "fulfilment"), true);
  });

  it("accepts all platform-admin provisioning templates, including salon-os", () => {
    for (const key of ["generic-retail", "ambady-nursery", "salon-os"]) {
      assert.equal(parseVerticalTemplateKey(key), key);
    }
  });
});
