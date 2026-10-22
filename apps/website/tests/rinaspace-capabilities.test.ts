import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RINASPACE_SECTIONS,
  getRinaSpaceSectionsForRole,
} from "../lib/rinaspace-capabilities";

describe("RINASPACE capability registry", () => {
  it("uses the locked workspace taxonomy", () => {
    assert.deepEqual(
      RINASPACE_SECTIONS.map((section) => section.id),
      ["run", "grow", "sell", "create", "build", "learn", "experience"],
    );
  });

  it("does not expose the removed hard-coded launcher routes", () => {
    const hrefs = RINASPACE_SECTIONS.flatMap((section) =>
      section.capabilities.map((capability) => capability.href),
    );

    assert.equal(hrefs.includes("/os/rinpo"), false);
    assert.equal(hrefs.includes("/os/orders"), false);
    assert.equal(hrefs.includes("/os/payments"), false);
    assert.equal(hrefs.includes("/os/notifications"), false);
  });

  it("keeps founder/owner access to the complete Wave 0 registry", () => {
    const total = RINASPACE_SECTIONS.reduce(
      (count, section) => count + section.capabilities.length,
      0,
    );
    const founderTotal = getRinaSpaceSectionsForRole("founder").reduce(
      (count, section) => count + section.capabilities.length,
      0,
    );
    const ownerTotal = getRinaSpaceSectionsForRole("owner").reduce(
      (count, section) => count + section.capabilities.length,
      0,
    );

    assert.equal(founderTotal, total);
    assert.equal(ownerTotal, total);
  });

  it("does not give ordinary members admin-only capability visibility", () => {
    const memberIds = getRinaSpaceSectionsForRole("member").flatMap((section) =>
      section.capabilities.map((capability) => capability.id),
    );

    assert.equal(memberIds.includes("finance"), false);
    assert.equal(memberIds.includes("approvals"), false);
    assert.equal(memberIds.includes("ads"), false);
    assert.equal(memberIds.includes("engineering"), false);
    assert.equal(memberIds.includes("ai"), false);
    assert.equal(memberIds.includes("automate"), false);
  });

  it("keeps customer access limited to experience capabilities in Wave 0", () => {
    const customerSections = getRinaSpaceSectionsForRole("customer");

    assert.deepEqual(customerSections.map((section) => section.id), ["experience"]);
    assert.deepEqual(
      customerSections[0]?.capabilities.map((capability) => capability.id),
      ["phone", "world"],
    );
  });
});
