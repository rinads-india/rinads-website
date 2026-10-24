import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildExternalConnectorDiscoveryCatalog,
  getRinadsConnector,
  listRinadsConnectors,
  listRinadsConnectorsByClass,
  listRinadsExternalAgentTargets,
} from "../src/connector-registry";

describe("RI connector registry", () => {
  it("keeps connector keys unique", () => {
    const connectors = listRinadsConnectors();
    const keys = connectors.map((connector) => connector.key);
    assert.equal(new Set(keys).size, keys.length);
  });

  it("routes every connector through the RINPO Runtime boundary", () => {
    assert.equal(
      listRinadsConnectors().every((connector) => connector.executionBoundary === "rinpo_runtime"),
      true
    );
  });

  it("never advertises external connector execution as live", () => {
    const catalog = buildExternalConnectorDiscoveryCatalog();
    assert.ok(catalog.length >= 20);
    assert.equal(catalog.every((connector) => connector.executionEnabled === false), true);
  });

  it("contains the launch-priority business and developer connectors", () => {
    for (const key of [
      "google_workspace",
      "github",
      "vercel",
      "supabase",
      "shopify",
      "wix",
      "wordpress",
      "whatsapp",
      "canva",
      "adobe",
      "runway",
    ] as const) {
      assert.ok(getRinadsConnector(key), `missing ${key}`);
    }
  });

  it("meters AI providers through RI Credits or BYOK rather than pretending they are unlimited", () => {
    const aiProviders = listRinadsConnectorsByClass("ai_provider");
    assert.equal(aiProviders.length, 4);
    assert.equal(aiProviders.every((provider) => provider.metering === "ri_credits_or_byok"), true);
  });

  it("does not allow direct external writes to protected infrastructure and payment state", () => {
    for (const key of ["supabase", "razorpay", "aws", "coolify"] as const) {
      assert.equal(getRinadsConnector(key)?.writePolicy, "blocked");
    }
  });

  it("requires approval for customer-facing communication and growth providers", () => {
    for (const key of ["whatsapp", "meta", "hootsuite", "metricool", "chatgpt_ads"] as const) {
      assert.equal(getRinadsConnector(key)?.writePolicy, "approval_required");
    }
  });

  it("targets one MCP gateway for ChatGPT, Codex, Claude, Gemini and Grok", () => {
    const targets = listRinadsExternalAgentTargets();
    assert.deepEqual(
      targets.map((target) => target.surface),
      ["chatgpt", "codex", "claude", "claude_code", "gemini", "grok"]
    );
    assert.equal(targets.every((target) => target.gateway === "mcp.rinads.com"), true);
    assert.equal(targets.every((target) => target.executionBoundary === "rinpo_runtime"), true);
    assert.equal(targets.every((target) => target.targetOnly === true), true);
  });
});
