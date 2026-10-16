import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HERO_COMMANDS, PLATFORM_OS, NAV_GROUPS, CTAS, POSITIONING } from "../lib/product-ia";
import { VERTICALS } from "../lib/content/verticals";
import { VERTICAL_AVAILABILITY } from "../lib/content/leads";
import { getIndexableRoutes, getRouteDefinition } from "../lib/route-registry";
import { PRICE_APPROVED } from "../lib/content/commercialConfig";

describe("Homepage UX V2 contracts", () => {
  it("keeps RINPO hero prompts outcome-led", () => {
    assert.ok(HERO_COMMANDS.length >= 4);
    assert.ok(HERO_COMMANDS.some((c) => /attention/i.test(c)));
    assert.ok(HERO_COMMANDS.some((c) => /automate/i.test(c)));
  });

  it("uses outcome-led positioning copy", () => {
    assert.match(POSITIONING.hero, /intelligent platform/i);
    assert.ok(POSITIONING.support.includes("RINPO"));
  });

  it("presents operating systems plus core product layers", () => {
    const operatingSystems = PLATFORM_OS.filter((item) => item.section !== "Core");
    const core = PLATFORM_OS.filter((item) => item.section === "Core");

    assert.equal(operatingSystems.length, 8);
    assert.ok(core.some((item) => item.label === "RINPO"));
    assert.ok(core.some((item) => item.label === "RINADS Intelligence"));
    assert.ok(core.some((item) => item.label === "RINADS Cloud"));
  });

  it("uses conversion navigation with RINPO and without empty Customers", () => {
    const labels = NAV_GROUPS.map((group) => group.label);
    assert.deepEqual(labels, [
      "Platform",
      "Solutions",
      "RINPO",
      "Services",
      "Academy",
      "Resources",
      "Company",
    ]);
    assert.equal(CTAS.primary.label, "Book a demo");
    assert.equal(CTAS.secondary.label, "Explore Business OS");
    assert.equal(CTAS.rinpo.label, "Try RINPO");
  });

  it("keeps salon as the available configuration vertical in legacy flags", () => {
    const available = VERTICALS.filter((vertical) => vertical.status === "available").map(
      (vertical) => vertical.slug,
    );
    assert.deepEqual(available, ["salon"]);
    assert.equal(
      VERTICAL_AVAILABILITY.find((item) => item.slug === "salon")?.status,
      "available_configuration",
    );
  });

  it("registers contact as an indexable destination", () => {
    const contact = getRouteDefinition("/contact");
    assert.ok(contact);
    assert.equal(contact?.indexable, true);
    assert.ok(getIndexableRoutes().some((route) => route.path === "/pricing"));
    assert.ok(getIndexableRoutes().some((route) => route.path === "/security"));
  });

  it("keeps home hero brand-first with RINPO demo surface", async () => {
    const { readFile } = await import("node:fs/promises");
    const hero = await readFile(new URL("../components/home/HomeHero.tsx", import.meta.url), "utf8");
    const sections = await readFile(
      new URL("../components/home/HomeSections.tsx", import.meta.url),
      "utf8",
    );
    const footer = await readFile(
      new URL("../components/rinads/Footer.tsx", import.meta.url),
      "utf8",
    );

    assert.match(hero, /Logo/);
    assert.match(hero, /RINADS TECHNOLOGIES/);
    assert.match(hero, /RinpoDemo/);
    assert.match(sections, /What do you want to improve/);
    assert.match(sections, /Demo workspace · Synthetic data|Configured pricing|Available \/ configurable now/i);
    assert.match(footer, /Meet RINPO\./);
    assert.doesNotMatch(footer, /Meet RINPO\?/);
    assert.doesNotMatch(footer, /href:\s*"https:\/\/www\.rinads\.com"/);
  });

  it("keeps pricing unapproved until commercial sign-off", () => {
    assert.equal(PRICE_APPROVED, false);
  });
});
