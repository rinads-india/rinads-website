import type { RinpoNluAdapter, RinpoNluContext, RinpoParsedIntent } from "./nlu-types";
import type { RinpoToolInput } from "./types";
import { deterministicRinpoNluAdapter } from "./nlu-deterministic";
import {
  resolveRinpoModelRoute,
  type RinpoLlmProvider,
  type RinpoResolvedModelRoute,
} from "./provider-router";

export type LlmRinpoNluConfig = {
  provider?: RinpoLlmProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  /** Used when the LLM is unavailable or returns an unusable payload. */
  fallback?: RinpoNluAdapter;
  fetchImpl?: typeof fetch;
};

export type RinpoLlmRouteInfo = Omit<RinpoResolvedModelRoute, "apiKey">;

/**
 * Optional OpenAI-compatible NLU adapter.
 *
 * Provider resolution lives in `provider-router.ts`. Existing
 * `RINADS_RINPO_LLM_*` configuration remains supported; provider-specific
 * variables can select xAI/Grok or OpenAI without changing RINPO's tool,
 * tenancy, permission, approval, or audit boundaries.
 */
export class LlmRinpoNluAdapter implements RinpoNluAdapter {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly provider: RinpoLlmProvider;
  private readonly fallback: RinpoNluAdapter;
  private readonly fetchImpl: typeof fetch;

  constructor(config: LlmRinpoNluConfig = {}) {
    const route = resolveRinpoModelRoute(config);
    this.apiKey = route.apiKey;
    this.baseUrl = route.baseUrl;
    this.model = route.model;
    this.provider = route.provider;
    this.fallback = config.fallback ?? deterministicRinpoNluAdapter;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  /** Safe runtime metadata for observability/admin UI. Never returns the key. */
  getRouteInfo(): RinpoLlmRouteInfo {
    return {
      provider: this.provider,
      baseUrl: this.baseUrl,
      model: this.model,
      configured: Boolean(this.apiKey && this.baseUrl && this.model),
    };
  }

  async parse(text: string, context: RinpoNluContext): Promise<RinpoParsedIntent> {
    if (!this.apiKey || !this.baseUrl || !this.model) {
      return {
        kind: "clarify",
        question:
          `RINPO ${this.provider} NLU is not configured. Use deterministic command patterns or configure the server-side provider route.`,
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
 * Default NLU selection: configured provider route when available; otherwise
 * deterministic parsing. This preserves the existing production-safe fallback.
 */
export function createRinpoNluAdapter(config: LlmRinpoNluConfig = {}): RinpoNluAdapter {
  const route = resolveRinpoModelRoute(config);
  if (!route.configured) {
    return config.fallback ?? deterministicRinpoNluAdapter;
  }
  return new LlmRinpoNluAdapter({ ...config, provider: route.provider, apiKey: route.apiKey, baseUrl: route.baseUrl, model: route.model });
}
