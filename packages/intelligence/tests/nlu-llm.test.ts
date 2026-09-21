import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { LlmRinpoNluAdapter, createRinpoNluAdapter } from "../src/nlu-llm";
import { DeterministicRinpoNluAdapter } from "../src/nlu-deterministic";

const baseCtx = { organizationId: "org_1" };

describe("LlmRinpoNluAdapter", () => {
  it("clarifies when no API key is configured", async () => {
    const adapter = new LlmRinpoNluAdapter({ apiKey: "" });
    const intent = await adapter.parse("What needs attention?", baseCtx);
    assert.equal(intent.kind, "clarify");
    if (intent.kind === "clarify") {
      assert.match(intent.question, /not configured/i);
    }
  });

  it("falls back to deterministic on HTTP failure", async () => {
    const fallback = new DeterministicRinpoNluAdapter();
    const adapter = new LlmRinpoNluAdapter({
      apiKey: "sk-test",
      fallback,
      fetchImpl: (async () => new Response("boom", { status: 500 })) as typeof fetch,
    });
    const intent = await adapter.parse("What needs attention right now?", baseCtx);
    assert.equal(intent.kind, "tool_calls");
  });

  it("parses a well-formed LLM JSON response", async () => {
    const adapter = new LlmRinpoNluAdapter({
      apiKey: "sk-test",
      fetchImpl: (async () =>
        new Response(
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
        )) as typeof fetch,
    });
    const intent = await adapter.parse("status", baseCtx);
    assert.equal(intent.kind, "tool_calls");
    if (intent.kind === "tool_calls") {
      assert.equal(intent.calls[0]?.tool, "get_salon_business_summary");
    }
  });

  it("createRinpoNluAdapter defaults to deterministic without key", async () => {
    const prev = process.env.RINADS_RINPO_LLM_API_KEY;
    delete process.env.RINADS_RINPO_LLM_API_KEY;
    try {
      const adapter = createRinpoNluAdapter({ apiKey: undefined });
      const intent = await adapter.parse("What needs attention right now?", baseCtx);
      assert.equal(intent.kind, "tool_calls");
    } finally {
      if (prev !== undefined) process.env.RINADS_RINPO_LLM_API_KEY = prev;
    }
  });
});
