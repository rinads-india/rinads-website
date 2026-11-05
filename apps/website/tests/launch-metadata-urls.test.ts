import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildOrganizationJsonLd,
  buildWebPageJsonLd,
  buildSoftwareApplicationJsonLd,
} from "../lib/json-ld";
import { COMPANY_CONFIG } from "../lib/content/companyConfig";
import { getDefaultSeoForPath, buildPageMetadata } from "@rinads/cms";
import { POSITIONING } from "../lib/product-ia";

describe("launch commercial metadata and URL contracts", () => {
  it("uses the canonical public category", () => {
    assert.equal(COMPANY_CONFIG.category, "Business Intelligence Platform");
    assert.equal(POSITIONING.category, "Business Intelligence Platform");
  });

  it("provides accurate homepage CMS SEO defaults", () => {
    const seo = getDefaultSeoForPath("/");
    assert.equal(seo?.title, "RINADS | Business, simplified.");
    assert.match(seo?.description ?? "", /run, sell, grow and automate/i);
    const metadata = buildPageMetadata(seo ?? null, "/", { siteUrl: "https://www.rinads.com" });
    assert.equal(metadata.title, "RINADS | Business, simplified.");
  });

  it("normalizes configured site URLs for structured data", () => {
    const org = buildOrganizationJsonLd(" https://www.rinads.com/\n ");
    assert.equal(org.url, "https://www.rinads.com");
    assert.equal(org.logo, "https://www.rinads.com/assets/rinads-logo.png");

    const page = buildWebPageJsonLd({
      path: "/business-readiness",
      title: "RINADS Business Readiness",
      description: "Assessment",
      siteUrl: " https://www.rinads.com/\n ",
    });
    assert.equal(page.url, "https://www.rinads.com/business-readiness");
  });

  it("offers a contact route that exists on the public website", () => {
    const app = buildSoftwareApplicationJsonLd({
      siteUrl: " https://www.rinads.com/\n ",
    });
    assert.deepEqual(app.offers, {
      "@type": "Offer",
      url: "https://www.rinads.com/company/contact?intent=demo",
    });
  });
});
