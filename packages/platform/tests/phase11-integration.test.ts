import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { migrateAmbadyTenantSeed, AMBADY_TENANT_SLUG } from "../src/ambady-migrate";
import { planIncludesModule } from "../src/subscriptions";
import { canAccessTenant } from "../src/lifecycle";
import { getOrgCommerceStore } from "@rinads/commerce-server";

describe("Ambady Tenant #1 migration", () => {
  it("seeds org-scoped commerce + ops under real org id", () => {
    const orgId = "00000000-0000-4000-8000-000000000001";
    const result = migrateAmbadyTenantSeed({ organizationId: orgId, slug: AMBADY_TENANT_SLUG });
    assert.ok(result.ok);
    const store = getOrgCommerceStore(orgId);
    assert.ok(store);
    assert.ok(store!.products.every((p) => p.organizationId === orgId));
  });
});

describe("subscription module gates", () => {
  it("starter excludes procurement", () => {
    assert.equal(planIncludesModule({ modules: ["commerce", "inventory"] }, "procurement"), false);
    assert.equal(planIncludesModule({ modules: ["commerce", "inventory", "procurement"] }, "procurement"), true);
  });
});

describe("tenant lifecycle", () => {
  it("blocks suspended tenants", () => {
    assert.equal(canAccessTenant("active"), true);
    assert.equal(canAccessTenant("suspended"), false);
  });
});
