import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveRinpoModelRoute } from "../src/provider-router";
import { LlmRinpoNluAdapter } from "../src/nlu-llm";

const baseCtx = { organizationId: "org_1" };

describe("RINPO provider router", () => {
  it("keeps the legacy deterministic default unconfigured without a RINPO key", () => {
    const previousProvider = process.env.RINADS_RINPO_LLM_PROVIDER;
    const previousLegacyKey = process.env.RINADS_RINPO_LLM_API_KEY;
    const previousOpenAiKey = process.env.RINADS_OPENAI_API_KEY;
    delete process.env.RINADS_RINPO_LLM_PROVIDER;
    delete process.env.RINADS_RINPO_LLM_API_KEY;
    delete process.env.RINADS_OPENAI_API_KEY;

    try {
      const route = resolveRinpoModelRoute();
      assert.equal(route.provider, "openai");
      assert.equal(route.configured, false);
    } finally {
      if (previousProvider !== undefined) process.env.RINADS_RINPO_LLM_PROVIDER = previousProvider;
      if (previousLegacyKey !== undefined) process.env.RINADS_RINPO_LLM_API_KEY = previousLegacyKey;
      if (previousOpenAiKey !== undefined) process.env.RINADS_OPENAI_API_KEY = previousOpenAiKey;
    }
  });

  it("resolves xAI/Grok with the xAI default endpoint and Grok 4.7", () => {
    const route = resolveRinpoModelRoute({ provider: "xai", apiKey: "xai-test" });
    assert.equal(route.provider, "xai");
    assert.equal(route.baseUrl, "https://api.x.ai/v1");
    assert.equal(route.model, "grok-4.7");
    assert.equal(route.configured, true);
  });

  it("uses the xAI route through the existing OpenAI-compatible NLU seam", async () => {
    let requestUrl = "";
    let requestBody = "";
    const adapter = new LlmRinpoNluAdapter({
      provider: "xai",
      apiKey: "xai-test",
      fetchImpl: (async (input, init) => {
        requestUrl = String(input);
        requestBody = String(init?.body ?? "");
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    kind: "tool_calls",
                    summary: "Attention board",
                    calls: [{ tool: "get_salon_business_summary", args: {} }],
                  }),
                },
              },
            ],
          }),
          { status: 200 }
        );
      }) as typeof fetch,
    });

    const intent = await adapter.parse("What needs attention?", baseCtx);
    assert.equal(requestUrl, "https://api.x.ai/v1/chat/completions");
    assert.match(requestBody, /"model":"grok-4\.7"/);
    assert.equal(intent.kind, "tool_calls");
  });

  it("does not expose an API key in route metadata", () => {
    const adapter = new LlmRinpoNluAdapter({ provider: "xai", apiKey: "super-secret" });
    const metadata = adapter.getRouteInfo();
    assert.equal(metadata.provider, "xai");
    assert.equal(metadata.configured, true);
    assert.equal("apiKey" in metadata, false);
  });
});
