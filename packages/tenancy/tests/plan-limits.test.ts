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

  it("blocks module access when no active plan or explicit entitlement exists", () => {
    const tenancy = { ...buildDemoTenancyContext({ planKey: "starter" }), planKey: undefined };
    const result = requirePlanModule(tenancy, "commerce");
    assert.equal(result.allowed, false);
    if (!result.allowed) assert.match(result.reason, /No active plan or trial entitlement/);
  });

  it("blocks malformed or empty explicit entitlement manifests", () => {
    const tenancy = buildDemoTenancyContext({ planKey: "starter" });
    assert.equal(requirePlanModule(tenancy, "commerce", {}).allowed, false);
    assert.equal(requirePlanModule(tenancy, "commerce", { modules: [] }).allowed, false);
  });
});
