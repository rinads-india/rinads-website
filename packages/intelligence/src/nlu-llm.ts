import type { RinpoNluAdapter, RinpoNluContext, RinpoParsedIntent } from "./nlu-types";
import type { RinpoToolInput } from "./types";
import { deterministicRinpoNluAdapter } from "./nlu-deterministic";

function readEnv(key: string): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.[key];
}

export type LlmRinpoNluConfig = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  /** Used when the LLM is unavailable or returns an unusable payload. */
  fallback?: RinpoNluAdapter;
  fetchImpl?: typeof fetch;
};

/**
 * Optional OpenAI-compatible NLU adapter. Disabled unless
 * `RINADS_RINPO_LLM_API_KEY` (or an explicit apiKey) is set.
 *
 * Without a key, `parse` clarifies that the LLM path is not configured —
 * callers should prefer `createRinpoNluAdapter()`, which keeps the
 * deterministic adapter as the default.
 */
export class LlmRinpoNluAdapter implements RinpoNluAdapter {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly fallback: RinpoNluAdapter;
  private readonly fetchImpl: typeof fetch;

  constructor(config: LlmRinpoNluConfig = {}) {
    this.apiKey = config.apiKey ?? readEnv("RINADS_RINPO_LLM_API_KEY");
    this.baseUrl = (config.baseUrl ?? readEnv("RINADS_RINPO_LLM_BASE_URL") ?? "https://api.openai.com/v1").replace(/\/$/, "");
    this.model = config.model ?? readEnv("RINADS_RINPO_LLM_MODEL") ?? "gpt-4o-mini";
    this.fallback = config.fallback ?? deterministicRinpoNluAdapter;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async parse(text: string, context: RinpoNluContext): Promise<RinpoParsedIntent> {
    if (!this.apiKey) {
      return {
        kind: "clarify",
        question:
          "LLM NLU is not configured (set RINADS_RINPO_LLM_API_KEY). Use the deterministic command patterns, or configure an OpenAI-compatible key.",
      };
    }

    try {
      const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are RINPO NLU for R GLOW. Reply with JSON only: " +
                '{"kind":"tool_calls","summary":"...","calls":[{"tool":"...","args":{...}}]} ' +
                'or {"kind":"clarify","question":"..."}. Never invent money-moving actions without explicit user intent.',
            },
            {
              role: "user",
              content: JSON.stringify({ text, context }),
            },
          ],
        }),
      });

      if (!response.ok) {
        return this.fallback.parse(text, context);
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        return this.fallback.parse(text, context);
      }

      const parsed = JSON.parse(content) as {
        kind?: string;
        question?: string;
        summary?: string;
        calls?: RinpoToolInput[];
      };

      if (parsed.kind === "clarify" && typeof parsed.question === "string") {
        return { kind: "clarify", question: parsed.question };
      }
      if (parsed.kind === "tool_calls" && Array.isArray(parsed.calls) && typeof parsed.summary === "string") {
        return { kind: "tool_calls", calls: parsed.calls, summary: parsed.summary };
      }
      return this.fallback.parse(text, context);
    } catch {
      return this.fallback.parse(text, context);
    }
  }
}

/**
 * Default NLU selection: LLM when `RINADS_RINPO_LLM_API_KEY` is set, otherwise
 * the deterministic pattern matcher (production default).
 */
export function createRinpoNluAdapter(config: LlmRinpoNluConfig = {}): RinpoNluAdapter {
  const apiKey = config.apiKey ?? readEnv("RINADS_RINPO_LLM_API_KEY");
  if (!apiKey) {
    return config.fallback ?? deterministicRinpoNluAdapter;
  }
  return new LlmRinpoNluAdapter({ ...config, apiKey });
}
