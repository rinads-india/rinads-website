import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPageMetadata, getDefaultSeoForPath, getPageBySlug, getSeoByPath, getServiceCardsFromPage } from "../src/index";

describe("@rinads/cms", () => {
  it("returns default SEO for /grow", async () => {
    const seo = await getSeoByPath(null, "/grow");
    assert.ok(seo);
    assert.match(seo!.title, /RINADS Grow/);
  });

  it("builds metadata with robots flags", () => {
    const seo = getDefaultSeoForPath("/os");
    const metadata = buildPageMetadata(seo, "/os");
    assert.equal(metadata.robots?.index, false);
  });

  it("loads home service cards from memory page", async () => {
    const page = await getPageBySlug(null, "home");
    const cards = getServiceCardsFromPage(page);
    assert.equal(cards.length, 3);
    assert.equal(cards[0]?.href, "/grow");
  });
});
