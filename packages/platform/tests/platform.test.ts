import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  seedTenantBundle,
  AMBADY_TENANT_SLUG,
  parseVerticalTemplateKey,
} from "../src/templates/index";
import { planIncludesModule } from "../src/subscriptions";
import { isUnexpiredTrialGrant } from "../src/provisioning-worker";
import { provisionTenantInMemory, provisionTenantViaRpc } from "../src/provisioning";

describe("Vertical templates", () => {
  it("validates every supported onboarding template", () => {
    for (const key of ["starter-business", "generic-retail", "ambady-nursery", "salon-os"]) {
      assert.equal(parseVerticalTemplateKey(key), key);
    }
    assert.throws(() => parseVerticalTemplateKey("unknown"), /Unknown template/);
  });

  it("defaults new tenants to neutral starter-business", () => {
    const bundle = seedTenantBundle("org_starter");
    assert.equal(bundle.commerce.products[0]?.organizationId, "org_starter");
    assert.equal(bundle.commerce.orders.length, 0);
    assert.equal(bundle.operations.tasks.length, 0);
  });

  it("seeds ambady-nursery for arbitrary org id", () => {
    const bundle = seedTenantBundle("org_new_tenant_001", "ambady-nursery");
    assert.equal(bundle.commerce.products[0]?.organizationId, "org_new_tenant_001");
    assert.ok(bundle.operations.locations.length >= 1);
    assert.ok(bundle.operations.movements.length >= 1);
  });

  it("seeds generic-retail template", () => {
    const bundle = seedTenantBundle("org_retail", "generic-retail");
    assert.equal(bundle.commerce.products.length, 1);
    assert.equal(bundle.operations.locations.length, 1);
  });

  it("seeds salon-os template with an empty, safe starting bundle", () => {
    const bundle = seedTenantBundle("org_salon", "salon-os");
    assert.equal(bundle.commerce.orders.length, 0);
    assert.ok(bundle.operations.locations.length >= 1);
  });

  it("defines ambady slug constant", () => {
    assert.equal(AMBADY_TENANT_SLUG, "ambady");
  });
});

describe("Provisioning defaults", () => {
  it("uses starter-business when no explicit template is supplied", async () => {
    const registrations = new Map<string, string>();
    const memoryResult = provisionTenantInMemory(
      {
        register(orgId, templateKey) {
          registrations.set(orgId, templateKey);
        },
        has(orgId) {
          return registrations.has(orgId);
        },
      },
      {
        organizationId: "org_default",
        name: "Default Business",
        slug: "default-business",
      },
    );

    assert.equal(memoryResult.ok, true);
    assert.equal(registrations.get("org_default"), "starter-business");

    let selectedTemplate = "";
    const rpcResult = await provisionTenantViaRpc(
      async (args) => {
        selectedTemplate = args.p_template_key;
        return {
          data: { id: "org_rpc_default", slug: args.p_slug },
          error: null,
        };
      },
      { name: "RPC Default", slug: "rpc-default" },
    );

    assert.equal(rpcResult.ok, true);
    assert.equal(selectedTemplate, "starter-business");
  });
});

describe("Plans", () => {
  it("checks module inclusion", () => {
    assert.ok(planIncludesModule({ modules: ["commerce", "inventory"] }, "inventory"));
    assert.ok(!planIncludesModule({ modules: ["commerce"] }, "procurement"));
  });

  it("fails closed for missing or empty module manifests", () => {
    assert.equal(planIncludesModule({}, "commerce"), false);
    assert.equal(planIncludesModule({ modules: [] }, "commerce"), false);
    assert.equal(planIncludesModule({ modules: "commerce" }, "commerce"), false);
  });
});

describe("Provisioning trial entitlement", () => {
  const now = Date.parse("2026-10-24T00:00:00Z");

  it("accepts an unexpired non-revoked trial", () => {
    assert.equal(
      isUnexpiredTrialGrant({ expires_at: "2026-10-25T00:00:00Z", revoked_at: null }, now),
      true,
    );
  });

  it("rejects expired, revoked and malformed trial grants", () => {
    assert.equal(
      isUnexpiredTrialGrant({ expires_at: "2026-10-23T23:59:59Z", revoked_at: null }, now),
      false,
    );
    assert.equal(
      isUnexpiredTrialGrant({ expires_at: "2026-10-25T00:00:00Z", revoked_at: "2026-10-24T00:00:00Z" }, now),
      false,
    );
    assert.equal(isUnexpiredTrialGrant({ expires_at: "not-a-date", revoked_at: null }, now), false);
  });
});
