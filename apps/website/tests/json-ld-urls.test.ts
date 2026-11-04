import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildOrganizationJsonLd,
  buildWebPageJsonLd,
  buildSoftwareApplicationJsonLd,
} from "../lib/json-ld";

describe("public structured data URL safety", () => {
  it("trims environment-style whitespace and trailing slash from canonical base", () => {
    const org = buildOrganizationJsonLd(" https://www.rinads.com/\n");
    assert.equal(org.url, "https://www.rinads.com");
    assert.equal(org.logo, "https://www.rinads.com/assets/rinads-logo.png");

    const page = buildWebPageJsonLd({
      path: "/platform",
      title: "RINADS Platform",
      description: "Platform",
      siteUrl: "https://www.rinads.com/\n",
    });
    assert.equal(page.url, "https://www.rinads.com/platform");
  });

  it("points the commercial offer to the existing company contact route", () => {
    const application = buildSoftwareApplicationJsonLd({
      siteUrl: "https://www.rinads.com/\n",
    });
    const offer = application.offers as { url: string };
    assert.equal(offer.url, "https://www.rinads.com/company/contact?intent=demo");
  });
});
