import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HERO_COMMANDS, PLATFORM_OS, NAV_GROUPS, CTAS, POSITIONING } from "../lib/product-ia";
import { VERTICALS } from "../lib/content/verticals";
import { VERTICAL_AVAILABILITY } from "../lib/content/leads";
import { getIndexableRoutes, getRouteDefinition } from "../lib/route-registry";

describe("Homepage UX V2 contracts", () => {
  it("keeps the hero focused on four RINPO entry prompts", () => {
    assert.equal(HERO_COMMANDS.length, 4);
    assert.ok(HERO_COMMANDS.includes("Build something"));
    assert.ok(HERO_COMMANDS.includes("Automate a workflow"));
  });

  it("uses outcome-led positioning copy", () => {
    assert.match(POSITIONING.hero, /AI operating platform/i);
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

  it("uses commercial navigation without top-level RINPO complexity", () => {
    const labels = NAV_GROUPS.map((group) => group.label);
    assert.deepEqual(labels, [
      "Product",
      "Solutions",
      "Customers",
      "Pricing",
      "Resources",
      "Services",
      "Academy",
    ]);
    assert.equal(CTAS.primary.label, "Book a platform demo");
    assert.equal(CTAS.secondary.label, "Explore Business OS");
  });

  it("keeps salon as the available configuration vertical in legacy flags", () => {
    const available = VERTICALS.filter((vertical) => vertical.status === "available").map((vertical) => vertical.slug);
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
});
