import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  INDUSTRY_FAMILIES,
  RINADS_INDUSTRIES,
  getIndustry,
  getIndustriesByFamily,
  resolveIndustryTemplate,
  searchIndustries,
} from "../src/industries/index";

describe("Industry registry", () => {
  it("contains the uploaded Business in a Box industry set", () => {
    const uploaded = RINADS_INDUSTRIES.filter((industry) => industry.source === "uploaded");
    assert.equal(uploaded.length, 42);
  });

  it("defines the 30 RINADS industry families", () => {
    assert.equal(INDUSTRY_FAMILIES.length, 30);
  });

  it("routes salon-family onboarding to salon-os", () => {
    assert.equal(resolveIndustryTemplate("salon"), "salon-os");
    assert.equal(resolveIndustryTemplate("beauty-personal-care"), "salon-os");
  });

  it("routes nursery and landscaping to ambady-nursery until dedicated packs exist", () => {
    assert.equal(resolveIndustryTemplate("nursery-horticulture"), "ambady-nursery");
    assert.equal(resolveIndustryTemplate("landscaping"), "ambady-nursery");
  });

  it("falls back safely for unknown industries", () => {
    assert.equal(resolveIndustryTemplate("not-a-real-industry"), "generic-retail");
  });

  it("supports alias search for priority RINADS verticals", () => {
    assert.equal(searchIndustries("bullion")[0]?.id, "jewellery-luxury");
    assert.equal(searchIndustries("visa consultant")[0]?.id, "immigration-services");
  });

  it("returns industries by family", () => {
    const beauty = getIndustriesByFamily("beauty-wellness");
    assert.ok(beauty.some((industry) => industry.id === "salon"));
    assert.ok(getIndustry("jewellery-luxury"));
  });
});
