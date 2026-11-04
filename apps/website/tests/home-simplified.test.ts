import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { POSITIONING } from "../lib/product-ia";
import { getPublicEditions } from "../lib/content/solutionCatalog";

describe("Business, simplified homepage release contracts", () => {
  it("leads with a customer benefit while keeping infrastructure positioning", () => {
    assert.equal(POSITIONING.homeHeadline, "Business, simplified.");
    assert.match(POSITIONING.homeSupport, /RINADS INTELLIGENCE/);
    assert.match(POSITIONING.homeSupport, /RINPO/);
    assert.match(POSITIONING.hero, /Business Intelligence Infrastructure/);
  });

  it("does not market unlaunched industry editions as activatable", () => {
    for (const edition of getPublicEditions()) {
      if (edition.status === "pilot") assert.equal(edition.ctaLabel, "Explore pilot");
      if (edition.status === "preview") assert.equal(edition.ctaLabel, "Explore preview");
      if (edition.status === "roadmap") assert.equal(edition.ctaLabel, "View roadmap");
      assert.ok(edition.href.startsWith("/solutions/"));
    }
  });

  it("keeps the hero example explicitly synthetic and separate from business actions", async () => {
    const hero = await readFile(new URL("../components/home/HomeHero.tsx", import.meta.url), "utf8");
    const preview = await readFile(new URL("../components/home/RinpoHeroPreview.tsx", import.meta.url), "utf8");
    const pulse = await readFile(new URL("../components/system/BusinessPulse.tsx", import.meta.url), "utf8");

    assert.match(hero, /POSITIONING.homeHeadline/);
    assert.match(hero, /RinpoHeroPreview/);
    assert.match(hero, /CTAS.tryRinpo.label/);
    assert.match(preview, /Synthetic demo/);
    assert.match(preview, /do not execute actions/);
    assert.match(preview, /openPhoneScreen/);
    assert.doesNotMatch(preview, /fetch\(/);
    assert.match(pulse, /Business pulse · sample workspace/);
    assert.doesNotMatch(pulse, /Live Business Pulse/);
  });
});
