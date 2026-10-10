export type RinpoLlmProvider = "openai" | "xai" | "custom";

export type RinpoModelRouteConfig = {
  provider?: RinpoLlmProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
};

export type RinpoResolvedModelRoute = {
  provider: RinpoLlmProvider;
  apiKey?: string;
  baseUrl: string;
  model: string;
  configured: boolean;
};

function readEnv(key: string): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const value = env?.[key]?.trim();
  return value || undefined;
}

function normalizeProvider(value: string | undefined): RinpoLlmProvider {
  if (value === "xai" || value === "custom") return value;
  return "openai";
}

function trimBaseUrl(value: string | undefined): string {
  return (value ?? "").replace(/\/$/, "");
}

/**
 * Resolve the OpenAI-compatible inference route used by RINPO NLU.
 *
 * Provider-specific environment variables are preferred over the legacy
 * RINADS_RINPO_LLM_* variables. The legacy variables remain supported so
 * existing deployments do not break while the intelligence gateway evolves.
 *
 * This resolver is server-side configuration only. It never exposes API keys
 * to browser code and it does not change tool authorization/approval rules.
 */
export function resolveRinpoModelRoute(config: RinpoModelRouteConfig = {}): RinpoResolvedModelRoute {
  const provider = normalizeProvider(config.provider ?? readEnv("RINADS_RINPO_LLM_PROVIDER"));

  if (provider === "xai") {
    const apiKey =
      config.apiKey ??
      readEnv("RINADS_XAI_API_KEY") ??
      readEnv("XAI_API_KEY") ??
      readEnv("RINADS_RINPO_LLM_API_KEY");
    const baseUrl = trimBaseUrl(
      config.baseUrl ??
        readEnv("RINADS_XAI_BASE_URL") ??
        readEnv("RINADS_RINPO_LLM_BASE_URL") ??
        "https://api.x.ai/v1"
    );
    const model =
      config.model ??
      readEnv("RINADS_XAI_MODEL") ??
      readEnv("RINADS_RINPO_LLM_MODEL") ??
      "grok-4.7";

    return {
      provider,
      apiKey,
      baseUrl,
      model,
      configured: Boolean(apiKey && baseUrl && model),
    };
  }

  if (provider === "custom") {
    const apiKey = config.apiKey ?? readEnv("RINADS_RINPO_LLM_API_KEY");
    const baseUrl = trimBaseUrl(config.baseUrl ?? readEnv("RINADS_RINPO_LLM_BASE_URL"));
    const model = config.model ?? readEnv("RINADS_RINPO_LLM_MODEL") ?? "";

    return {
      provider,
      apiKey,
      baseUrl,
      model,
      configured: Boolean(apiKey && baseUrl && model),
    };
  }

  const apiKey =
    config.apiKey ??
    readEnv("RINADS_OPENAI_API_KEY") ??
    readEnv("OPENAI_API_KEY") ??
    readEnv("RINADS_RINPO_LLM_API_KEY");
  const baseUrl = trimBaseUrl(
    config.baseUrl ??
      readEnv("RINADS_OPENAI_BASE_URL") ??
      readEnv("RINADS_RINPO_LLM_BASE_URL") ??
      "https://api.openai.com/v1"
  );
  const model =
    config.model ??
    readEnv("RINADS_OPENAI_MODEL") ??
    readEnv("RINADS_RINPO_LLM_MODEL") ??
    "gpt-4o-mini";

  return {
    provider,
    apiKey,
    baseUrl,
    model,
    configured: Boolean(apiKey && baseUrl && model),
  };
}
