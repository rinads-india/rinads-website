import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HERO_COMMANDS, PLATFORM_OS, NAV_GROUPS, POSITIONING } from "../lib/product-ia";
import { NAV_CTAS } from "../lib/ctas";
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
    assert.match(POSITIONING.hero, /intelligence/i);
    assert.ok(POSITIONING.support.includes("RINPO"));
  });

  it("presents operating systems plus core product layers", () => {
    const operatingSystems = PLATFORM_OS.filter((item) => item.section !== "Core");
    const core = PLATFORM_OS.filter((item) => item.section === "Core");

    assert.equal(operatingSystems.length, 5);
    assert.ok(core.some((item) => item.label === "RINADS Intelligence"));
    assert.ok(core.some((item) => item.label === "RINPO Runtime"));
    assert.ok(core.some((item) => item.label === "RINADS Platform"));
  });

  it("uses conversion navigation with RINPO and customer evidence anchors", () => {
    const labels = NAV_GROUPS.map((group) => group.label);
    assert.deepEqual(labels, [
      "Platform",
      "RINPO",
      "Solutions",
      "Services",
      "Customers",
      "Resources",
    ]);
    assert.equal(NAV_CTAS.primary.label, "Book a demo");
    assert.equal(NAV_CTAS.secondary.label, "Explore RINADS");
    assert.match(NAV_CTAS.rinpo.label, /RINPO/i);
  });

  it("keeps salon as the pilot edition in solution availability", () => {
    const available = VERTICALS.filter((vertical) => vertical.status === "available").map(
      (vertical) => vertical.slug,
    );
    assert.deepEqual(available, ["salon"]);
    assert.equal(VERTICAL_AVAILABILITY.find((item) => item.slug === "salon")?.status, "pilot");
  });

  it("registers company contact and trust destinations", () => {
    const contact = getRouteDefinition("/company/contact");
    assert.ok(contact);
    assert.equal(contact?.indexable, true);
    assert.ok(getIndexableRoutes().some((route) => route.path === "/pricing"));
    assert.ok(getIndexableRoutes().some((route) => route.path === "/trust/security"));
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
    assert.match(hero, /openPhoneScreen/);
    assert.match(sections, /Customer evidence/);
    assert.match(sections, /Business Readiness/);
    assert.match(sections, /business_readiness_started/);
    assert.match(footer, /Meet RINPO\./);
    assert.doesNotMatch(footer, /Meet RINPO\?/);
    assert.doesNotMatch(footer, /href:\s*"https:\/\/www\.rinads\.com"/);
  });

  it("keeps pricing unapproved until commercial sign-off", () => {
    assert.equal(PRICE_APPROVED, false);
  });
});
