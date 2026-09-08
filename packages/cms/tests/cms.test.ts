import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPageMetadata, getDefaultSeoForPath, getPageBySlug, getSeoByPath, getServiceCardsFromPage } from "../src/index";

describe("@rinads/cms", () => {
  it("returns default SEO for /grow (legacy path)", async () => {
    const seo = await getSeoByPath(null, "/grow");
    assert.ok(seo);
    assert.match(seo!.title, /Marketing OS/);
  });

  it("returns default SEO for Marketing OS", async () => {
    const seo = await getSeoByPath(null, "/platform/marketing-os");
    assert.ok(seo);
    assert.match(seo!.title, /Marketing OS/);
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
    assert.equal(cards[0]?.href, "/services/software");
  });
});
