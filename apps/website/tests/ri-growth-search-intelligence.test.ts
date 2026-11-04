import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { getCanonicalUrl, getIndexableRoutes, getRouteDefinition } from "../lib/route-registry";

const path = "/grow/search-intelligence";

describe("RI GROWTH Search Intelligence pilot release contract", () => {
  it("uses one indexable canonical marketing route", () => {
    const route = getRouteDefinition(path);
    assert.ok(route);
    assert.equal(route.indexable, true);
    assert.equal(route.pageType, "product");
    assert.ok(getIndexableRoutes().some((entry) => entry.path === path));
    assert.equal(new URL(getCanonicalUrl(path)).pathname, path);
  });

  it("states pilot limitations and provides a real audit request path", () => {
    const source = readFileSync(new URL("../app/grow/search-intelligence/page.tsx", import.meta.url), "utf8");
    assert.match(source, /Pilot planning/);
    assert.match(source, /Google Search Console/);
    assert.match(source, /not represented here as active integrations/);
    assert.match(source, /\/contact\?intent=audit&source=ri-growth-search-intelligence/);
    assert.doesNotMatch(source, /guaranteed (rankings|traffic|citations)/i);
  });

  it("connects pilot entry points to the same route", () => {
    const grow = readFileSync(new URL("../app/grow/GrowClient.tsx", import.meta.url), "utf8");
    const growth = readFileSync(new URL("../app/platform/growth/page.tsx", import.meta.url), "utf8");
    assert.match(grow, /href="\/grow\/search-intelligence"/);
    assert.match(growth, /href: "\/grow\/search-intelligence"/);
  });
});
