import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RINASPACE_SECTIONS,
  getRinaSpaceSectionsForContext,
} from "../lib/rinaspace-capabilities";

function capabilityIds(input: Parameters<typeof getRinaSpaceSectionsForContext>[0]): string[] {
  return getRinaSpaceSectionsForContext(input).flatMap((section) =>
    section.capabilities.map((capability) => capability.id),
  );
}

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

  it("lets a fully entitled salon founder see the complete P1 registry", () => {
    const total = RINASPACE_SECTIONS.reduce(
      (count, section) => count + section.capabilities.length,
      0,
    );
    const visible = capabilityIds({
      role: "founder",
      planKey: "platform",
      verticalKey: "salon-os",
      featureFlags: {
        "commerce.enabled": true,
        "erp.fulfilment": true,
        "rinpo.ops": true,
      },
    });

    assert.equal(visible.length, total);
    assert.equal(visible.includes("r-glow"), true);
  });

  it("applies plan, vertical and feature entitlements independently of role", () => {
    const visible = capabilityIds({
      role: "owner",
      planKey: "starter",
      verticalKey: "generic-retail",
      featureFlags: {
        "commerce.enabled": true,
        "erp.fulfilment": false,
        "rinpo.ops": false,
      },
    });

    assert.equal(visible.includes("commerce"), true);
    assert.equal(visible.includes("finance"), false);
    assert.equal(visible.includes("logistics"), false);
    assert.equal(visible.includes("ai"), false);
    assert.equal(visible.includes("r-glow"), false);
  });

  it("shows R GLOW only for the salon industry pack", () => {
    const salon = capabilityIds({
      role: "admin",
      planKey: "growth",
      verticalKey: "salon-os",
      featureFlags: { "commerce.enabled": true, "erp.fulfilment": true },
    });
    const retail = capabilityIds({
      role: "admin",
      planKey: "growth",
      verticalKey: "generic-retail",
      featureFlags: { "commerce.enabled": true, "erp.fulfilment": true },
    });

    assert.equal(salon.includes("r-glow"), true);
    assert.equal(retail.includes("r-glow"), false);
  });

  it("does not give ordinary members admin-only capability visibility", () => {
    const memberIds = capabilityIds({
      role: "member",
      planKey: "platform",
      verticalKey: "generic-retail",
      featureFlags: {
        "commerce.enabled": true,
        "erp.fulfilment": true,
        "rinpo.ops": true,
      },
    });

    assert.equal(memberIds.includes("finance"), false);
    assert.equal(memberIds.includes("approvals"), false);
    assert.equal(memberIds.includes("ads"), false);
    assert.equal(memberIds.includes("engineering"), false);
    assert.equal(memberIds.includes("ai"), false);
    assert.equal(memberIds.includes("automate"), false);
  });

  it("keeps customer access limited to experience capabilities", () => {
    const customerSections = getRinaSpaceSectionsForContext({
      role: "customer",
      planKey: "platform",
      verticalKey: "salon-os",
      featureFlags: {
        "commerce.enabled": true,
        "erp.fulfilment": true,
        "rinpo.ops": true,
      },
    });

    assert.deepEqual(customerSections.map((section) => section.id), ["experience"]);
    assert.deepEqual(
      customerSections[0]?.capabilities.map((capability) => capability.id),
      ["phone", "world"],
    );
  });

  it("allows an explicit feature override to remove commerce from the launcher", () => {
    const ids = capabilityIds({
      role: "owner",
      planKey: "growth",
      verticalKey: "generic-retail",
      featureFlags: { "commerce.enabled": false, "erp.fulfilment": true },
    });

    assert.equal(ids.includes("commerce"), false);
    assert.equal(ids.includes("logistics"), true);
  });
});
