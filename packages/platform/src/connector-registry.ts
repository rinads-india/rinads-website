export type RinadsConnectorClass =
  | "ai_provider"
  | "workspace"
  | "developer"
  | "commerce"
  | "growth"
  | "creative"
  | "communication"
  | "logistics"
  | "payments"
  | "infrastructure";

export type RinadsConnectorTransport =
  | "mcp"
  | "oauth_api"
  | "rest_api"
  | "webhook"
  | "native_plugin"
  | "provider_sdk";

export type RinadsConnectorCredentialMode =
  | "tenant_oauth"
  | "tenant_api_key"
  | "platform_managed"
  | "byok_or_platform";

export type RinadsConnectorWritePolicy = "read_only" | "approval_required" | "blocked";

export type RinadsConnectorMetering =
  | "none"
  | "provider_billing"
  | "ri_credits"
  | "ri_credits_or_byok";

export type RinadsConnectorKey =
  | "openai"
  | "google_ai"
  | "anthropic"
  | "xai"
  | "google_workspace"
  | "github"
  | "vercel"
  | "supabase"
  | "shopify"
  | "wix"
  | "wordpress"
  | "chatgpt_ads"
  | "meta"
  | "hootsuite"
  | "metricool"
  | "canva"
  | "adobe"
  | "runway"
  | "whatsapp"
  | "shiprocket"
  | "delhivery"
  | "dtdc"
  | "porter"
  | "sequel"
  | "bvc"
  | "razorpay"
  | "aws"
  | "coolify";

export type RinadsConnectorDefinition = {
  key: RinadsConnectorKey;
  name: string;
  class: RinadsConnectorClass;
  transports: readonly RinadsConnectorTransport[];
  credentialMode: RinadsConnectorCredentialMode;
  writePolicy: RinadsConnectorWritePolicy;
  metering: RinadsConnectorMetering;
  purposes: readonly string[];
  /**
   * All provider work remains behind the governed RINPO Runtime boundary.
   * A connector must never be called directly from tenant-domain UI code.
   */
  executionBoundary: "rinpo_runtime";
};

const CONNECTORS: readonly RinadsConnectorDefinition[] = [
  {
    key: "openai",
    name: "OpenAI",
    class: "ai_provider",
    transports: ["rest_api", "provider_sdk", "mcp"],
    credentialMode: "byok_or_platform",
    writePolicy: "approval_required",
    metering: "ri_credits_or_byok",
    purposes: ["reasoning", "generation", "tool_use", "agent_distribution"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "google_ai",
    name: "Google AI / Gemini",
    class: "ai_provider",
    transports: ["rest_api", "provider_sdk", "mcp"],
    credentialMode: "byok_or_platform",
    writePolicy: "approval_required",
    metering: "ri_credits_or_byok",
    purposes: ["reasoning", "vision", "generation", "google_ecosystem"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "anthropic",
    name: "Anthropic / Claude",
    class: "ai_provider",
    transports: ["rest_api", "provider_sdk", "mcp"],
    credentialMode: "byok_or_platform",
    writePolicy: "approval_required",
    metering: "ri_credits_or_byok",
    purposes: ["reasoning", "coding", "tool_use", "agent_distribution"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "xai",
    name: "xAI / Grok",
    class: "ai_provider",
    transports: ["rest_api", "provider_sdk", "mcp"],
    credentialMode: "byok_or_platform",
    writePolicy: "approval_required",
    metering: "ri_credits_or_byok",
    purposes: ["reasoning", "public_intelligence", "trend_research"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "google_workspace",
    name: "Google Workspace",
    class: "workspace",
    transports: ["oauth_api", "mcp", "webhook"],
    credentialMode: "tenant_oauth",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["gmail", "calendar", "drive", "docs", "sheets", "slides", "meet"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "github",
    name: "GitHub",
    class: "developer",
    transports: ["oauth_api", "rest_api", "mcp", "webhook"],
    credentialMode: "tenant_oauth",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["repositories", "issues", "pull_requests", "ci", "releases"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "vercel",
    name: "Vercel",
    class: "developer",
    transports: ["oauth_api", "rest_api", "mcp", "webhook"],
    credentialMode: "tenant_oauth",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["deployments", "domains", "hosting", "runtime_health"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "supabase",
    name: "Supabase",
    class: "developer",
    transports: ["rest_api", "provider_sdk", "webhook"],
    credentialMode: "platform_managed",
    writePolicy: "blocked",
    metering: "provider_billing",
    purposes: ["postgres", "auth", "storage", "realtime", "edge_functions"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "shopify",
    name: "Shopify",
    class: "commerce",
    transports: ["oauth_api", "rest_api", "mcp", "webhook"],
    credentialMode: "tenant_oauth",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["catalog", "inventory", "orders", "customers", "checkout", "analytics"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "wix",
    name: "Wix",
    class: "commerce",
    transports: ["oauth_api", "rest_api", "mcp", "webhook"],
    credentialMode: "tenant_oauth",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["websites", "commerce", "bookings", "cms", "members", "crm"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "wordpress",
    name: "WordPress",
    class: "commerce",
    transports: ["oauth_api", "rest_api", "mcp", "webhook"],
    credentialMode: "tenant_oauth",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["websites", "publishing", "content", "commerce"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "chatgpt_ads",
    name: "ChatGPT Ads Manager",
    class: "growth",
    transports: ["native_plugin"],
    credentialMode: "tenant_oauth",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["ads", "campaigns", "performance", "delivery_diagnostics"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "meta",
    name: "Meta",
    class: "growth",
    transports: ["oauth_api", "rest_api", "webhook"],
    credentialMode: "tenant_oauth",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["ads", "instagram", "facebook", "audiences", "analytics"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "hootsuite",
    name: "Hootsuite",
    class: "growth",
    transports: ["oauth_api", "mcp"],
    credentialMode: "tenant_oauth",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["social_publishing", "inbox", "listening", "analytics"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "metricool",
    name: "Metricool",
    class: "growth",
    transports: ["oauth_api", "rest_api"],
    credentialMode: "tenant_oauth",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["social_analytics", "publishing", "scheduling", "reporting"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "canva",
    name: "Canva",
    class: "creative",
    transports: ["oauth_api", "mcp", "native_plugin"],
    credentialMode: "tenant_oauth",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["design", "templates", "social_creative", "presentations", "brand_assets"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "adobe",
    name: "Adobe Creative Cloud",
    class: "creative",
    transports: ["oauth_api", "rest_api", "native_plugin"],
    credentialMode: "tenant_oauth",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["creative_assets", "image_editing", "video", "pdf", "brand_production"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "runway",
    name: "Runway",
    class: "creative",
    transports: ["rest_api", "native_plugin"],
    credentialMode: "byok_or_platform",
    writePolicy: "approval_required",
    metering: "ri_credits_or_byok",
    purposes: ["rinpo_live", "video_generation", "image_generation", "localization"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "whatsapp",
    name: "WhatsApp Business Platform",
    class: "communication",
    transports: ["oauth_api", "rest_api", "webhook"],
    credentialMode: "tenant_oauth",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["customer_messaging", "notifications", "campaigns", "support"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "shiprocket",
    name: "Shiprocket",
    class: "logistics",
    transports: ["rest_api", "webhook"],
    credentialMode: "tenant_api_key",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["rates", "serviceability", "shipments", "tracking", "returns"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "delhivery",
    name: "Delhivery",
    class: "logistics",
    transports: ["rest_api", "webhook"],
    credentialMode: "tenant_api_key",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["serviceability", "shipments", "tracking", "returns"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "dtdc",
    name: "DTDC",
    class: "logistics",
    transports: ["rest_api", "webhook"],
    credentialMode: "tenant_api_key",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["shipments", "tracking", "collection_point"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "porter",
    name: "Porter",
    class: "logistics",
    transports: ["rest_api", "webhook"],
    credentialMode: "tenant_api_key",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["same_day_delivery", "vehicle_booking", "tracking"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "sequel",
    name: "Sequel Logistics",
    class: "logistics",
    transports: ["rest_api", "webhook"],
    credentialMode: "tenant_api_key",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["secure_logistics", "jewellery_delivery", "tracking", "returns"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "bvc",
    name: "BVC Logistics",
    class: "logistics",
    transports: ["rest_api", "webhook"],
    credentialMode: "tenant_api_key",
    writePolicy: "approval_required",
    metering: "provider_billing",
    purposes: ["secure_logistics", "jewellery_delivery", "tracking"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "razorpay",
    name: "Razorpay",
    class: "payments",
    transports: ["rest_api", "webhook"],
    credentialMode: "platform_managed",
    writePolicy: "blocked",
    metering: "provider_billing",
    purposes: ["subscriptions", "payments", "payment_links", "ri_credit_topups"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "aws",
    name: "Amazon Web Services",
    class: "infrastructure",
    transports: ["rest_api", "provider_sdk"],
    credentialMode: "platform_managed",
    writePolicy: "blocked",
    metering: "provider_billing",
    purposes: ["storage", "queues", "compute", "backup", "enterprise_workloads"],
    executionBoundary: "rinpo_runtime",
  },
  {
    key: "coolify",
    name: "Coolify",
    class: "infrastructure",
    transports: ["rest_api", "webhook"],
    credentialMode: "platform_managed",
    writePolicy: "blocked",
    metering: "provider_billing",
    purposes: ["workers", "webhooks", "mcp", "background_jobs", "self_hosting"],
    executionBoundary: "rinpo_runtime",
  },
] as const;

export type RinadsConnectorDiscoveryEntry = Pick<
  RinadsConnectorDefinition,
  "key" | "name" | "class" | "transports" | "writePolicy" | "metering" | "purposes"
> & {
  executionEnabled: false;
};

export function listRinadsConnectors(): readonly RinadsConnectorDefinition[] {
  return CONNECTORS;
}

export function getRinadsConnector(key: RinadsConnectorKey): RinadsConnectorDefinition | undefined {
  return CONNECTORS.find((connector) => connector.key === key);
}

export function listRinadsConnectorsByClass(
  connectorClass: RinadsConnectorClass
): readonly RinadsConnectorDefinition[] {
  return CONNECTORS.filter((connector) => connector.class === connectorClass);
}

/**
 * Discovery metadata only. This must never be interpreted as tenant connection
 * status, credential availability, entitlement or permission to execute.
 */
export function buildExternalConnectorDiscoveryCatalog(): readonly RinadsConnectorDiscoveryEntry[] {
  return CONNECTORS.map((connector) => ({
    key: connector.key,
    name: connector.name,
    class: connector.class,
    transports: connector.transports,
    writePolicy: connector.writePolicy,
    metering: connector.metering,
    purposes: connector.purposes,
    executionEnabled: false,
  }));
}

export type RinadsExternalAgentSurface =
  | "chatgpt"
  | "codex"
  | "claude"
  | "claude_code"
  | "gemini"
  | "grok";

export type RinadsExternalAgentTarget = {
  surface: RinadsExternalAgentSurface;
  gateway: "mcp.rinads.com";
  protocol: "mcp";
  executionBoundary: "rinpo_runtime";
  targetOnly: true;
};

const EXTERNAL_AGENT_TARGETS: readonly RinadsExternalAgentTarget[] = [
  "chatgpt",
  "codex",
  "claude",
  "claude_code",
  "gemini",
  "grok",
].map((surface) => ({
  surface: surface as RinadsExternalAgentSurface,
  gateway: "mcp.rinads.com",
  protocol: "mcp",
  executionBoundary: "rinpo_runtime",
  targetOnly: true,
}));

/**
 * Target compatibility contract, not a live availability claim. Every external
 * agent surface reaches RINADS through the same MCP authorization boundary.
 */
export function listRinadsExternalAgentTargets(): readonly RinadsExternalAgentTarget[] {
  return EXTERNAL_AGENT_TARGETS;
}
