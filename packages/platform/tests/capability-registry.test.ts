import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildExternalAgentCapabilityCatalog,
  canExternalAgentExecuteWithoutApproval,
  getRinadsCapability,
  listRinadsCapabilities,
} from "../src/capability-registry";

describe("RINADS capability registry", () => {
  it("keeps external execution disabled in discovery metadata", () => {
    const catalog = buildExternalAgentCapabilityCatalog();
    assert.ok(catalog.length > 0);
    assert.equal(catalog.every((capability) => capability.executionEnabled === false), true);
  });

  it("allows only read-only capabilities without an approval requirement", () => {
    for (const capability of listRinadsCapabilities()) {
      const allowed = canExternalAgentExecuteWithoutApproval(capability.key);
      assert.equal(allowed, capability.externalAgentPolicy === "read_only");
      if (allowed) assert.equal(capability.risk, "READ");
    }
  });

  it("blocks sensitive checkout, campaign launch and shipment cancellation", () => {
    assert.equal(getRinadsCapability("commerce.checkout.create")?.externalAgentPolicy, "blocked");
    assert.equal(getRinadsCapability("growth.campaign.launch")?.externalAgentPolicy, "blocked");
    assert.equal(getRinadsCapability("logistics.shipment.cancel")?.externalAgentPolicy, "blocked");
  });

  it("registers Shopify, Shiprocket and direct-carrier capabilities without claiming live configuration", () => {
    const catalog = listRinadsCapabilities();
    assert.ok(catalog.some((capability) => capability.providers.includes("shopify")));
    assert.ok(catalog.some((capability) => capability.providers.includes("shiprocket")));
    assert.ok(catalog.some((capability) => capability.providers.includes("delhivery")));
    assert.equal("configured" in catalog[0], false);
  });
});
