import type { RinpoNluAdapter, RinpoNluContext, RinpoParsedIntent } from "./nlu-types";
import type { RinpoToolInput } from "./types";
import { deterministicRinpoNluAdapter } from "./nlu-deterministic";
import { RinpoModelClient } from "./model-client";
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

const RINPO_NLU_SYSTEM_PROMPT =
  "You are RINPO NLU for R GLOW. Reply with JSON only: " +
  '{"kind":"tool_calls","summary":"...","calls":[{"tool":"...","args":{...}}]} ' +
  'or {"kind":"clarify","question":"..."}. Never invent money-moving actions without explicit user intent.';

/**
 * Optional provider-neutral NLU adapter.
 *
 * Inference transport is delegated to `RinpoModelClient`, while RINPO's
 * tenancy, permission, approval, tool and audit boundaries remain unchanged.
 * Unsupported/unavailable model output always falls back to the deterministic
 * parser rather than bypassing governance.
 */
export class LlmRinpoNluAdapter implements RinpoNluAdapter {
  private readonly route: RinpoResolvedModelRoute;
  private readonly fallback: RinpoNluAdapter;
  private readonly client: RinpoModelClient;

  constructor(config: LlmRinpoNluConfig = {}) {
    this.route = resolveRinpoModelRoute(config);
    this.fallback = config.fallback ?? deterministicRinpoNluAdapter;
    this.client = new RinpoModelClient(this.route, config.fetchImpl ?? fetch);
  }

  /** Safe runtime metadata for observability/admin UI. Never returns the key. */
  getRouteInfo(): RinpoLlmRouteInfo {
    return {
      provider: this.route.provider,
      baseUrl: this.route.baseUrl,
      model: this.route.model,
      configured: this.route.configured,
    };
  }

  async parse(text: string, context: RinpoNluContext): Promise<RinpoParsedIntent> {
    if (!this.route.configured) {
      return {
        kind: "clarify",
        question:
          `RINPO ${this.route.provider} NLU is not configured. Use deterministic command patterns or configure the server-side provider route.`,
      };
    }

    try {
      const content = await this.client.generateJsonText({
        system: RINPO_NLU_SYSTEM_PROMPT,
        user: { text, context },
        maxOutputTokens: 1024,
      });
      if (!content) return this.fallback.parse(text, context);

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
  return new LlmRinpoNluAdapter({
    ...config,
    provider: route.provider,
    apiKey: route.apiKey,
    baseUrl: route.baseUrl,
    model: route.model,
  });
}
