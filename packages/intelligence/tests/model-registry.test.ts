import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { listRinpoModelRegistry, selectRinpoModel } from "../src/model-registry";

const MANAGED_ENV = [
  "RINADS_RINPO_LLM_PROVIDER",
  "RINADS_RINPO_LLM_API_KEY",
  "RINADS_OPENAI_API_KEY",
  "OPENAI_API_KEY",
  "RINADS_XAI_API_KEY",
  "XAI_API_KEY",
  "RINADS_RINPO_LLM_BASE_URL",
  "RINADS_RINPO_LLM_MODEL",
  "RINADS_OPENAI_BASE_URL",
  "RINADS_OPENAI_MODEL",
  "RINADS_XAI_BASE_URL",
  "RINADS_XAI_MODEL",
] as const;

function withCleanEnv(run: () => void): void {
  const previous = Object.fromEntries(MANAGED_ENV.map((key) => [key, process.env[key]]));
  for (const key of MANAGED_ENV) delete process.env[key];
  try {
    run();
  } finally {
    for (const key of MANAGED_ENV) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe("RINPO model registry", () => {
  it("keeps a legacy key scoped to the selected provider", () => {
    withCleanEnv(() => {
      process.env.RINADS_RINPO_LLM_PROVIDER = "xai";
      process.env.RINADS_RINPO_LLM_API_KEY = "legacy-xai-key";

      const registry = listRinpoModelRegistry();
      const xai = registry.find((entry) => entry.provider === "xai");
      const openai = registry.find((entry) => entry.provider === "openai");
      const custom = registry.find((entry) => entry.provider === "custom");

      assert.equal(xai?.configured, true);
      assert.equal(xai?.selectedByDefault, true);
      assert.equal(openai?.configured, false);
      assert.equal(custom?.configured, false);
    });
  });

  it("never returns external-model routing for restricted data", () => {
    withCleanEnv(() => {
      process.env.RINADS_RINPO_LLM_PROVIDER = "xai";
      process.env.RINADS_XAI_API_KEY = "xai-test";

      const selection = selectRinpoModel("research", "restricted", {
        allowExternalResearch: true,
      });

      assert.equal(selection.mode, "deterministic");
    });
  });

  it("prefers configured xAI for research only when external research is allowed", () => {
    withCleanEnv(() => {
      process.env.RINADS_RINPO_LLM_PROVIDER = "openai";
      process.env.RINADS_OPENAI_API_KEY = "openai-test";
      process.env.RINADS_XAI_API_KEY = "xai-test";

      const selection = selectRinpoModel("research", "internal", {
        allowExternalResearch: true,
      });

      assert.equal(selection.mode, "model");
      if (selection.mode === "model") {
        assert.equal(selection.route.provider, "xai");
        assert.equal("apiKey" in selection.route, false);
      }
    });
  });

  it("uses the configured default route for research when external research is not allowed", () => {
    withCleanEnv(() => {
      process.env.RINADS_RINPO_LLM_PROVIDER = "openai";
      process.env.RINADS_OPENAI_API_KEY = "openai-test";
      process.env.RINADS_XAI_API_KEY = "xai-test";

      const selection = selectRinpoModel("research", "internal");

      assert.equal(selection.mode, "model");
      if (selection.mode === "model") assert.equal(selection.route.provider, "openai");
    });
  });

  it("enforces provider allowlists before provider preferences", () => {
    withCleanEnv(() => {
      process.env.RINADS_RINPO_LLM_PROVIDER = "openai";
      process.env.RINADS_OPENAI_API_KEY = "openai-test";
      process.env.RINADS_XAI_API_KEY = "xai-test";

      const selection = selectRinpoModel("reasoning", "internal", {
        allowedProviders: ["openai"],
        preferredProvider: "xai",
      });

      assert.equal(selection.mode, "model");
      if (selection.mode === "model") assert.equal(selection.route.provider, "openai");
    });
  });
});
