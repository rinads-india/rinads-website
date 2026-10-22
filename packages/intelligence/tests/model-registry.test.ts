import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { listRinpoModelRegistry, selectRinpoModel } from "../src/model-registry";

const MANAGED_ENV = [
  "RINADS_RINPO_LLM_PROVIDER",
  "RINADS_RINPO_LLM_API_KEY",
  "RINADS_OPENAI_API_KEY",
  "OPENAI_API_KEY",
  "RINADS_ANTHROPIC_API_KEY",
  "ANTHROPIC_API_KEY",
  "RINADS_GOOGLE_AI_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "RINADS_XAI_API_KEY",
  "XAI_API_KEY",
  "RINADS_RINPO_LLM_BASE_URL",
  "RINADS_RINPO_LLM_MODEL",
  "RINADS_OPENAI_BASE_URL",
  "RINADS_OPENAI_MODEL",
  "RINADS_ANTHROPIC_BASE_URL",
  "RINADS_ANTHROPIC_MODEL",
  "RINADS_GOOGLE_AI_BASE_URL",
  "RINADS_GOOGLE_AI_MODEL",
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
      const anthropic = registry.find((entry) => entry.provider === "anthropic");
      const google = registry.find((entry) => entry.provider === "google");
      const custom = registry.find((entry) => entry.provider === "custom");

      assert.equal(xai?.configured, true);
      assert.equal(xai?.selectedByDefault, true);
      assert.equal(openai?.configured, false);
      assert.equal(anthropic?.configured, false);
      assert.equal(google?.configured, false);
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

  it("prefers Anthropic for coding when it is configured and allowed", () => {
    withCleanEnv(() => {
      process.env.RINADS_RINPO_LLM_PROVIDER = "openai";
      process.env.RINADS_OPENAI_API_KEY = "openai-test";
      process.env.RINADS_ANTHROPIC_API_KEY = "anthropic-test";

      const selection = selectRinpoModel("code", "internal");

      assert.equal(selection.mode, "model");
      if (selection.mode === "model") {
        assert.equal(selection.route.provider, "anthropic");
        assert.equal(selection.route.model, "claude-sonnet-5-5");
      }
    });
  });

  it("prefers Google for vision when it is configured and allowed", () => {
    withCleanEnv(() => {
      process.env.RINADS_RINPO_LLM_PROVIDER = "openai";
      process.env.RINADS_OPENAI_API_KEY = "openai-test";
      process.env.RINADS_GOOGLE_AI_API_KEY = "google-test";

      const selection = selectRinpoModel("vision", "internal");

      assert.equal(selection.mode, "model");
      if (selection.mode === "model") {
        assert.equal(selection.route.provider, "google");
        assert.equal(selection.route.model, "gemini-3.8-flash");
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

  it("enforces provider allowlists before task or provider preferences", () => {
    withCleanEnv(() => {
      process.env.RINADS_RINPO_LLM_PROVIDER = "openai";
      process.env.RINADS_OPENAI_API_KEY = "openai-test";
      process.env.RINADS_ANTHROPIC_API_KEY = "anthropic-test";
      process.env.RINADS_XAI_API_KEY = "xai-test";

      const selection = selectRinpoModel("code", "internal", {
        allowedProviders: ["openai"],
        preferredProvider: "xai",
      });

      assert.equal(selection.mode, "model");
      if (selection.mode === "model") assert.equal(selection.route.provider, "openai");
    });
  });
});
