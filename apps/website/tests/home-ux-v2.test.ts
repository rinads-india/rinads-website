import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HERO_COMMANDS, PLATFORM_OS } from "../lib/product-ia";
import { VERTICALS } from "../lib/content/verticals";

describe("Homepage UX V2 contracts", () => {
  it("keeps the hero focused on four RINPO entry prompts", () => {
    assert.equal(HERO_COMMANDS.length, 4);
    assert.ok(HERO_COMMANDS.includes("Build something"));
    assert.ok(HERO_COMMANDS.includes("Automate a workflow"));
  });

  it("presents exactly eight operating systems before the platform core", () => {
    const operatingSystems = PLATFORM_OS.filter((item) => item.section !== "Core");
    const core = PLATFORM_OS.filter((item) => item.section === "Core");

    assert.equal(operatingSystems.length, 8);
    assert.deepEqual(
      core.map((item) => item.label),
      ["RINADS Intelligence", "RINADS Cloud"]
    );
  });

  it("keeps current solution availability sourced from the existing vertical catalogue", () => {
    const available = VERTICALS.filter((vertical) => vertical.status === "available").map((vertical) => vertical.slug);
    const coming = VERTICALS.filter((vertical) => vertical.status === "coming").map((vertical) => vertical.slug);

    assert.deepEqual(available, ["retail", "nursery", "salon"]);
    assert.deepEqual(coming, ["jewellery", "healthcare", "logistics"]);
  });
});
