export type RinadsCapabilityDomain =
  | "commerce"
  | "logistics"
  | "growth"
  | "communication"
  | "intelligence";

export type RinadsCapabilityRisk = "READ" | "DRAFT" | "WRITE" | "ACTION" | "SENSITIVE";

export type RinadsExternalAgentPolicy = "read_only" | "approval_required" | "blocked";

export type RinadsCapabilityProvider =
  | "rinads"
  | "shopify"
  | "shiprocket"
  | "delhivery"
  | "dtdc"
  | "porter"
  | "sequel"
  | "bvc"
  | "meta"
  | "google"
  | "whatsapp";

export type RinadsCapabilityKey =
  | "commerce.catalog.read"
  | "commerce.order.read"
  | "commerce.cart.create"
  | "commerce.checkout.create"
  | "logistics.quote.read"
  | "logistics.shipment.track"
  | "logistics.shipment.create"
  | "logistics.shipment.cancel"
  | "logistics.return.create"
  | "growth.performance.read"
  | "growth.campaign.draft"
  | "growth.campaign.launch"
  | "communication.message.draft"
  | "communication.message.send"
  | "intelligence.business_summary.read"
  | "intelligence.recommendation.read";

export type RinadsCapabilityDefinition = {
  key: RinadsCapabilityKey;
  domain: RinadsCapabilityDomain;
  description: string;
  risk: RinadsCapabilityRisk;
  externalAgentPolicy: RinadsExternalAgentPolicy;
  providers: readonly RinadsCapabilityProvider[];
};

const CAPABILITIES: readonly RinadsCapabilityDefinition[] = [
  {
    key: "commerce.catalog.read",
    domain: "commerce",
    description: "Read governed product, variant and availability projections.",
    risk: "READ",
    externalAgentPolicy: "read_only",
    providers: ["rinads", "shopify"],
  },
  {
    key: "commerce.order.read",
    domain: "commerce",
    description: "Read an authorized tenant-scoped order projection.",
    risk: "READ",
    externalAgentPolicy: "read_only",
    providers: ["rinads", "shopify"],
  },
  {
    key: "commerce.cart.create",
    domain: "commerce",
    description: "Create or update a governed cart without capturing payment.",
    risk: "WRITE",
    externalAgentPolicy: "approval_required",
    providers: ["rinads", "shopify"],
  },
  {
    key: "commerce.checkout.create",
    domain: "commerce",
    description: "Create a checkout or payment handoff from an authorized cart.",
    risk: "SENSITIVE",
    externalAgentPolicy: "blocked",
    providers: ["rinads", "shopify"],
  },
  {
    key: "logistics.quote.read",
    domain: "logistics",
    description: "Read normalized shipping quotes and serviceability evidence.",
    risk: "READ",
    externalAgentPolicy: "read_only",
    providers: ["rinads", "shiprocket", "delhivery", "dtdc", "porter", "sequel", "bvc"],
  },
  {
    key: "logistics.shipment.track",
    domain: "logistics",
    description: "Read normalized shipment tracking evidence.",
    risk: "READ",
    externalAgentPolicy: "read_only",
    providers: ["rinads", "shiprocket", "delhivery", "dtdc", "porter", "sequel", "bvc"],
  },
  {
    key: "logistics.shipment.create",
    domain: "logistics",
    description: "Create a carrier shipment from an authorized shipment intent.",
    risk: "ACTION",
    externalAgentPolicy: "approval_required",
    providers: ["rinads", "shiprocket", "delhivery", "dtdc", "porter", "sequel", "bvc"],
  },
  {
    key: "logistics.shipment.cancel",
    domain: "logistics",
    description: "Request cancellation of a shipment through the selected carrier.",
    risk: "SENSITIVE",
    externalAgentPolicy: "blocked",
    providers: ["rinads", "shiprocket", "delhivery", "dtdc", "porter", "sequel", "bvc"],
  },
  {
    key: "logistics.return.create",
    domain: "logistics",
    description: "Create a governed reverse-logistics request.",
    risk: "ACTION",
    externalAgentPolicy: "approval_required",
    providers: ["rinads", "shiprocket", "delhivery", "dtdc", "sequel", "bvc"],
  },
  {
    key: "growth.performance.read",
    domain: "growth",
    description: "Read normalized campaign and funnel performance metrics.",
    risk: "READ",
    externalAgentPolicy: "read_only",
    providers: ["rinads", "meta", "google", "shiprocket"],
  },
  {
    key: "growth.campaign.draft",
    domain: "growth",
    description: "Draft campaign targeting, creative and budget proposals without publishing.",
    risk: "DRAFT",
    externalAgentPolicy: "approval_required",
    providers: ["rinads", "meta", "google", "shiprocket"],
  },
  {
    key: "growth.campaign.launch",
    domain: "growth",
    description: "Publish or activate a paid campaign after governed authorization.",
    risk: "SENSITIVE",
    externalAgentPolicy: "blocked",
    providers: ["rinads", "meta", "google", "shiprocket"],
  },
  {
    key: "communication.message.draft",
    domain: "communication",
    description: "Draft an outbound customer or staff message without sending it.",
    risk: "DRAFT",
    externalAgentPolicy: "approval_required",
    providers: ["rinads", "whatsapp"],
  },
  {
    key: "communication.message.send",
    domain: "communication",
    description: "Send an approved outbound message through a configured channel.",
    risk: "ACTION",
    externalAgentPolicy: "approval_required",
    providers: ["rinads", "whatsapp"],
  },
  {
    key: "intelligence.business_summary.read",
    domain: "intelligence",
    description: "Read a governed Business Graph summary for the active organization.",
    risk: "READ",
    externalAgentPolicy: "read_only",
    providers: ["rinads"],
  },
  {
    key: "intelligence.recommendation.read",
    domain: "intelligence",
    description: "Read deterministic or model-assisted RI recommendations without executing them.",
    risk: "READ",
    externalAgentPolicy: "read_only",
    providers: ["rinads"],
  },
] as const;

export type RinadsAgentCapabilityCatalogEntry = Pick<
  RinadsCapabilityDefinition,
  "key" | "domain" | "description" | "risk" | "externalAgentPolicy"
> & {
  providers: readonly RinadsCapabilityProvider[];
  executionEnabled: boolean;
};

export function listRinadsCapabilities(): readonly RinadsCapabilityDefinition[] {
  return CAPABILITIES;
}

export function getRinadsCapability(key: RinadsCapabilityKey): RinadsCapabilityDefinition | undefined {
  return CAPABILITIES.find((capability) => capability.key === key);
}

/**
 * Safe discovery projection for ChatGPT, Claude, Gemini, MCP clients and other
 * external agents. This is metadata only: it never proves that a tenant has a
 * provider configured and it never authorizes execution.
 */
export function buildExternalAgentCapabilityCatalog(): readonly RinadsAgentCapabilityCatalogEntry[] {
  return CAPABILITIES.map((capability) => ({
    key: capability.key,
    domain: capability.domain,
    description: capability.description,
    risk: capability.risk,
    externalAgentPolicy: capability.externalAgentPolicy,
    providers: capability.providers,
    executionEnabled: false,
  }));
}

export function canExternalAgentExecuteWithoutApproval(key: RinadsCapabilityKey): boolean {
  return getRinadsCapability(key)?.externalAgentPolicy === "read_only";
}
