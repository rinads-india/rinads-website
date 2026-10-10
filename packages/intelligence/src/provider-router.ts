export type RinpoLlmProvider = "openai" | "xai" | "custom";

export type RinpoModelRouteConfig = {
  provider?: RinpoLlmProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  /**
   * Keep legacy `RINADS_RINPO_LLM_API_KEY` compatibility for the selected
   * provider. Registry/discovery callers can disable this to avoid treating
   * one legacy credential as if it configured every provider.
   */
  allowLegacyApiKeyFallback?: boolean;
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
 * Backwards compatibility is deliberate: if no provider is explicitly
 * selected, only the legacy RINADS_RINPO_LLM_API_KEY (or an explicit config
 * key) activates LLM NLU. This prevents an unrelated OPENAI_API_KEY from
 * silently changing the production-safe deterministic default.
 *
 * Provider-specific environment variables are used once a provider is
 * explicitly selected. This resolver is server-side only and never changes
 * RINPO's tenancy, permission, approval, or audit boundaries.
 */
export function resolveRinpoModelRoute(config: RinpoModelRouteConfig = {}): RinpoResolvedModelRoute {
  const envProviderSelector = readEnv("RINADS_RINPO_LLM_PROVIDER");
  const providerSelector = config.provider ?? envProviderSelector;
  const provider = normalizeProvider(providerSelector);
  const providerWasExplicit = Boolean(providerSelector);

  const legacyFallbackApplies =
    config.allowLegacyApiKeyFallback ??
    (config.provider
      ? envProviderSelector
        ? config.provider === normalizeProvider(envProviderSelector)
        : config.provider === "openai"
      : true);
  const legacyApiKey = legacyFallbackApplies ? readEnv("RINADS_RINPO_LLM_API_KEY") : undefined;

  if (provider === "xai") {
    const apiKey = config.apiKey ?? readEnv("RINADS_XAI_API_KEY") ?? readEnv("XAI_API_KEY") ?? legacyApiKey;
    const baseUrl = trimBaseUrl(
      config.baseUrl ??
        readEnv("RINADS_XAI_BASE_URL") ??
        readEnv("RINADS_RINPO_LLM_BASE_URL") ??
        "https://api.x.ai/v1"
    );
    const model =
      config.model ?? readEnv("RINADS_XAI_MODEL") ?? readEnv("RINADS_RINPO_LLM_MODEL") ?? "grok-4.7";

    return {
      provider,
      apiKey,
      baseUrl,
      model,
      configured: Boolean(apiKey && baseUrl && model),
    };
  }

  if (provider === "custom") {
    const apiKey = config.apiKey ?? legacyApiKey;
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
    (providerWasExplicit ? readEnv("RINADS_OPENAI_API_KEY") : undefined) ??
    legacyApiKey;
  const baseUrl = trimBaseUrl(
    config.baseUrl ??
      (providerWasExplicit ? readEnv("RINADS_OPENAI_BASE_URL") : undefined) ??
      readEnv("RINADS_RINPO_LLM_BASE_URL") ??
      "https://api.openai.com/v1"
  );
  const model =
    config.model ??
    (providerWasExplicit ? readEnv("RINADS_OPENAI_MODEL") : undefined) ??
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
