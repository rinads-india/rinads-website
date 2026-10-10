import { resolveRinpoModelRoute, type RinpoLlmProvider, type RinpoResolvedModelRoute } from "./provider-router";

export type RinpoTaskKind =
  | "nlu"
  | "research"
  | "reasoning"
  | "code"
  | "vision"
  | "voice"
  | "translation";

export type RinpoDataSensitivity = "public" | "internal" | "confidential" | "restricted";

export type RinpoProviderHealthStatus = "configured" | "not_configured";

export type RinpoModelRegistryEntry = {
  provider: RinpoLlmProvider;
  model: string;
  baseUrl: string;
  configured: boolean;
  selectedByDefault: boolean;
  health: RinpoProviderHealthStatus;
};

export type RinpoRoutingPolicy = {
  /** Providers this tenant/workspace is allowed to use. Omit to allow configured providers. */
  allowedProviders?: RinpoLlmProvider[];
  /** Required before a research task can prefer an external-search-capable route such as xAI. */
  allowExternalResearch?: boolean;
  /** Caller preference. It is ignored when the provider is not configured or allowed. */
  preferredProvider?: RinpoLlmProvider;
};

export type RinpoModelSelection =
  | {
      mode: "model";
      task: RinpoTaskKind;
      sensitivity: RinpoDataSensitivity;
      route: Omit<RinpoResolvedModelRoute, "apiKey">;
      reason: string;
    }
  | {
      mode: "deterministic";
      task: RinpoTaskKind;
      sensitivity: RinpoDataSensitivity;
      reason: string;
    };

const PROVIDERS: RinpoLlmProvider[] = ["openai", "xai", "custom"];

function selectedProvider(): RinpoLlmProvider {
  return resolveRinpoModelRoute().provider;
}

function resolveProviderForRegistry(provider: RinpoLlmProvider, selected: RinpoLlmProvider): RinpoResolvedModelRoute {
  return resolveRinpoModelRoute({
    provider,
    allowLegacyApiKeyFallback: provider === selected,
  });
}

function safeRoute(route: RinpoResolvedModelRoute): Omit<RinpoResolvedModelRoute, "apiKey"> {
  return {
    provider: route.provider,
    baseUrl: route.baseUrl,
    model: route.model,
    configured: route.configured,
  };
}

function isAllowed(provider: RinpoLlmProvider, policy: RinpoRoutingPolicy): boolean {
  return !policy.allowedProviders || policy.allowedProviders.includes(provider);
}

/**
 * Safe, server-side registry snapshot for Founder Intelligence / diagnostics.
 * API keys are deliberately absent.
 */
export function listRinpoModelRegistry(): RinpoModelRegistryEntry[] {
  const selected = selectedProvider();
  return PROVIDERS.map((provider) => {
    const route = resolveProviderForRegistry(provider, selected);
    return {
      provider,
      model: route.model,
      baseUrl: route.baseUrl,
      configured: route.configured,
      selectedByDefault: provider === selected,
      health: route.configured ? "configured" : "not_configured",
    };
  });
}

/**
 * Conservative task-aware router.
 *
 * Invariants:
 * - restricted data never leaves the deterministic/local path;
 * - research only prefers xAI when external research is explicitly allowed;
 * - provider allowlists are enforced before preferences;
 * - an unavailable provider never becomes a hard dependency;
 * - no API key is returned to callers.
 */
export function selectRinpoModel(
  task: RinpoTaskKind,
  sensitivity: RinpoDataSensitivity = "internal",
  policy: RinpoRoutingPolicy = {}
): RinpoModelSelection {
  if (sensitivity === "restricted") {
    return {
      mode: "deterministic",
      task,
      sensitivity,
      reason: "Restricted data is kept out of external model providers by default.",
    };
  }

  const selected = selectedProvider();
  const configured = PROVIDERS.map((provider) => resolveProviderForRegistry(provider, selected)).filter(
    (route) => route.configured && isAllowed(route.provider, policy)
  );

  if (configured.length === 0) {
    return {
      mode: "deterministic",
      task,
      sensitivity,
      reason: "No configured provider is permitted by the current routing policy.",
    };
  }

  if (policy.preferredProvider) {
    const preferred = configured.find((route) => route.provider === policy.preferredProvider);
    if (preferred) {
      return {
        mode: "model",
        task,
        sensitivity,
        route: safeRoute(preferred),
        reason: `Using explicitly preferred provider ${preferred.provider}.`,
      };
    }
  }

  if (task === "research" && policy.allowExternalResearch) {
    const xai = configured.find((route) => route.provider === "xai");
    if (xai) {
      return {
        mode: "model",
        task,
        sensitivity,
        route: safeRoute(xai),
        reason: "Research task may use the configured xAI route because external research is allowed.",
      };
    }
  }

  const defaultRoute = configured.find((route) => route.provider === selected) ?? configured[0];

  return {
    mode: "model",
    task,
    sensitivity,
    route: safeRoute(defaultRoute),
    reason:
      defaultRoute.provider === selected
        ? `Using the configured default provider ${selected}.`
        : `Default provider is unavailable or disallowed; using configured fallback ${defaultRoute.provider}.`,
  };
}
