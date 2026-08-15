import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CatalogService } from "@rinads/commerce";
import { createOrgScopedCommerceRepository } from "@rinads/commerce-server";

describe("cross-tenant RLS simulation (in-memory)", () => {
  it("org A cannot see org B products via context filter", () => {
    const repoA = createOrgScopedCommerceRepository("org_a");
    const repoB = createOrgScopedCommerceRepository("org_b");
    const catalogA = new CatalogService(repoA);
    const catalogB = new CatalogService(repoB);

    const storeB = repoB.getStore();
    storeB.products.push({
      id: "prod_secret_b",
      organizationId: "org_b",
      name: "Secret B",
      slug: "secret-b",
      description: "",
      status: "published",
      categorySlug: "test",
      tags: [],
      ratingAvg: 0,
      ratingCount: 0,
    });
    repoB.saveStore(storeB);

    const listedA = catalogA.listPublished({ organizationId: "org_a" });
    assert.equal(listedA.find((p) => p.id === "prod_secret_b"), undefined);

    const listedB = catalogB.listPublished({ organizationId: "org_b" });
    assert.ok(listedB.find((p) => p.id === "prod_secret_b"));
  });
});
