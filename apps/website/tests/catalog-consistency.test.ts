import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PRODUCT_CATALOG, OS_AVAILABILITY, getProduct } from "../lib/content/productCatalog";
import {
  SOLUTION_CATALOG,
  VERTICAL_AVAILABILITY,
  getVerticalAvailability,
} from "../lib/content/solutionCatalog";
import { SOLUTION_EXPERIENCES } from "../lib/solution-experience";
import { PRODUCT_STATUS_META, isProductStatusValue } from "../lib/product-status";
import { PRICE_APPROVED, PRICING_PLANS } from "../lib/content/commercialConfig";
import { PLATFORM_OS } from "../lib/product-ia";

describe("product catalog consistency", () => {
  it("every catalog product has a valid status", () => {
    for (const product of PRODUCT_CATALOG) {
      assert.ok(isProductStatusValue(product.status), product.slug);
      assert.ok(PRODUCT_STATUS_META[product.status].label.length > 0);
    }
  });

  it("OS_AVAILABILITY mirrors catalog excluding RINPO", () => {
    assert.equal(
      OS_AVAILABILITY.length,
      PRODUCT_CATALOG.filter((p) => p.id !== "rinpo").length,
    );
    for (const os of OS_AVAILABILITY) {
      const product = getProduct(os.slug);
      assert.ok(product, os.slug);
      assert.equal(product!.status, os.status);
    }
  });

  it("nav platform statuses align with catalog for known slugs", () => {
    for (const link of PLATFORM_OS) {
      const slug = link.href.replace("/platform/", "").replace("/rinpo", "rinpo");
      const product = getProduct(slug === "rinpo" ? "rinpo" : slug);
      if (!product) continue;
      assert.equal(link.status, PRODUCT_STATUS_META[product.status].label, link.label);
    }
  });

  it("available-now group only contains production-supportable statuses", () => {
    for (const product of PRODUCT_CATALOG.filter((p) => p.availabilityGroup === "now")) {
      assert.ok(
        product.status === "available" || product.status === "pilot",
        product.slug,
      );
    }
  });
});

describe("solution catalog consistency", () => {
  it("vertical availability matches solution catalog for page slugs", () => {
    for (const vertical of VERTICAL_AVAILABILITY) {
      const solution = SOLUTION_CATALOG.find((s) => s.slug === vertical.slug);
      assert.ok(solution, vertical.slug);
      assert.equal(solution!.status, vertical.status);
      assert.equal(solution!.tier, vertical.tier);
    }
  });

  it("solution experience status notes stay honest for preview and pilot", () => {
    for (const [slug, experience] of Object.entries(SOLUTION_EXPERIENCES)) {
      const availability = getVerticalAvailability(slug);
      if (availability.status === "preview" || availability.status === "roadmap") {
        assert.doesNotMatch(experience.statusNote, /^available$/i);
      }
      if (availability.status === "pilot") {
        assert.match(experience.statusNote, /pilot/i);
      }
    }
  });
});

describe("commercial config", () => {
  it("keeps priceApproved false until commercial sign-off", () => {
    assert.equal(PRICE_APPROVED, false);
  });

  it("every plan has a non-blank price representation when not approved", () => {
    for (const plan of PRICING_PLANS) {
      assert.ok(
        plan.monthlyPrice === "contact" ||
          plan.monthlyPrice === "coming_soon" ||
          typeof plan.monthlyPrice === "number",
      );
      assert.ok(plan.cta.label.length > 0);
      assert.ok(plan.cta.href.includes("/contact"));
    }
  });
});
