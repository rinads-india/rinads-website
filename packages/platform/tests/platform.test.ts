import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { seedTenantBundle, AMBADY_TENANT_SLUG } from "../src/templates/index";
import { planIncludesModule } from "../src/subscriptions";

describe("Vertical templates", () => {
  it("seeds ambady-nursery for arbitrary org id", () => {
    const bundle = seedTenantBundle("org_new_tenant_001", "ambady-nursery");
    assert.equal(bundle.commerce.products[0]?.organizationId, "org_new_tenant_001");
    assert.ok(bundle.operations.locations.length >= 1);
    assert.ok(bundle.operations.movements.length >= 1);
  });

  it("defines ambady slug constant", () => {
    assert.equal(AMBADY_TENANT_SLUG, "ambady");
  });
});

describe("Plans", () => {
  it("checks module inclusion", () => {
    assert.ok(planIncludesModule({ modules: ["commerce", "inventory"] }, "inventory"));
    assert.ok(!planIncludesModule({ modules: ["commerce"] }, "procurement"));
  });
});
