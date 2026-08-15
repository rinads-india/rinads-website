import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { requirePlanModule } from "../src/plan-limits";
import { buildDemoTenancyContext } from "../src/load";

describe("requirePlanModule", () => {
  it("allows commerce on starter plan", () => {
    const tenancy = buildDemoTenancyContext({ planKey: "starter" });
    const result = requirePlanModule(tenancy, "commerce");
    assert.equal(result.allowed, true);
  });

  it("blocks procurement on starter plan", () => {
    const tenancy = buildDemoTenancyContext({ planKey: "starter" });
    const result = requirePlanModule(tenancy, "procurement");
    assert.equal(result.allowed, false);
    if (!result.allowed) assert.ok(result.upgradeRequired);
  });

  it("blocks suspended org", () => {
    const tenancy = buildDemoTenancyContext({ organizationStatus: "suspended" });
    const result = requirePlanModule(tenancy, "commerce");
    assert.equal(result.allowed, false);
  });
});
