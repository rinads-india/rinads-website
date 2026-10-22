export type RinadsBrandCategory =
  | "corporate"
  | "core"
  | "platform"
  | "rinaverse"
  | "industry-rinaverse"
  | "integration-rinaverse"
  | "experience";

export type RinadsLifecycle = "concept" | "alpha" | "beta" | "ga" | "retired";

export type RinadsBrandEntry = {
  key: string;
  name: string;
  category: RinadsBrandCategory;
  route?: string;
  host?: string;
  runtimeBoundary: boolean;
  lifecycle: RinadsLifecycle;
  trademarkReview?: boolean;
};

/**
 * Founder-approved canonical RINADS naming registry.
 *
 * Rules:
 * - Do not rename entries locally inside consuming apps.
 * - A brand name does not automatically justify a new app, repo, or subdomain.
 * - Third-party marks require public-usage/trademark review before implying partnership.
 */
export const brandRegistry = [
  {
    key: "rinads",
    name: "RINADS",
    category: "core",
    host: "rinads.com",
    runtimeBoundary: true,
    lifecycle: "ga",
  },
  {
    key: "rinads.technologies",
    name: "RINADS TECHNOLOGIES",
    category: "corporate",
    route: "/company",
    runtimeBoundary: false,
    lifecycle: "ga",
  },
  {
    key: "ri.intelligence",
    name: "RINADS INTELLIGENCE - RI",
    category: "core",
    host: "intelligence.rinads.com",
    route: "/intelligence",
    runtimeBoundary: true,
    lifecycle: "beta",
  },
  {
    key: "rinpo",
    name: "RINPO",
    category: "core",
    host: "rinpo.rinads.com",
    route: "/rinpo",
    runtimeBoundary: true,
    lifecycle: "beta",
  },
  {
    key: "rinpo.runtime",
    name: "RINPO RUNTIME",
    category: "core",
    runtimeBoundary: true,
    lifecycle: "beta",
  },
  {
    key: "rinpo.phone",
    name: "RINPO PHONE",
    category: "experience",
    route: "/app/phone",
    runtimeBoundary: false,
    lifecycle: "alpha",
  },
  {
    key: "ri.labs",
    name: "RI LABS",
    category: "core",
    route: "/labs",
    runtimeBoundary: false,
    lifecycle: "alpha",
  },
  {
    key: "rinads.studios",
    name: "RINADS STUDIOS",
    category: "experience",
    host: "studio.rinads.com",
    route: "/studios",
    runtimeBoundary: true,
    lifecycle: "alpha",
  },

  {
    key: "ri.id",
    name: "RI ID",
    category: "platform",
    route: "/ri/id",
    runtimeBoundary: false,
    lifecycle: "beta",
  },
  {
    key: "ri.space",
    name: "RI SPACE",
    category: "platform",
    route: "/app/space",
    runtimeBoundary: false,
    lifecycle: "beta",
  },
  {
    key: "ri.drive",
    name: "RI DRIVE",
    category: "platform",
    route: "/ri/drive",
    runtimeBoundary: false,
    lifecycle: "alpha",
  },
  {
    key: "ri.sheets",
    name: "RI SHEETS",
    category: "platform",
    route: "/ri/sheets",
    runtimeBoundary: false,
    lifecycle: "alpha",
  },
  {
    key: "ri.connectors",
    name: "RI CONNECTORS",
    category: "platform",
    route: "/ri/connectors",
    runtimeBoundary: false,
    lifecycle: "beta",
  },
  {
    key: "ri.partner",
    name: "RI PARTNER",
    category: "platform",
    route: "/partners",
    runtimeBoundary: false,
    lifecycle: "alpha",
  },
  {
    key: "ri.verified",
    name: "RI VERIFIED",
    category: "platform",
    route: "/verified",
    runtimeBoundary: false,
    lifecycle: "alpha",
  },
  {
    key: "ri.growth",
    name: "RI GROWTH",
    category: "platform",
    route: "/ri/growth",
    runtimeBoundary: false,
    lifecycle: "alpha",
  },
  {
    key: "ri.automation",
    name: "RI AUTOMATION",
    category: "platform",
    route: "/ri/automation",
    runtimeBoundary: false,
    lifecycle: "beta",
  },
  {
    key: "ri.logistics",
    name: "RI LOGISTICS",
    category: "platform",
    route: "/ri/logistics",
    runtimeBoundary: false,
    lifecycle: "beta",
  },

  {
    key: "rinaverse.world",
    name: "RI RINAVERSE",
    category: "rinaverse",
    host: "world.rinads.com",
    route: "/rinaverse",
    runtimeBoundary: true,
    lifecycle: "alpha",
  },
  {
    key: "rinaverse.network",
    name: "RI NETWORK RINAVERSE",
    category: "rinaverse",
    route: "/rinaverse/network",
    runtimeBoundary: false,
    lifecycle: "concept",
  },
  {
    key: "rinaverse.communications",
    name: "RI COMMUNICATIONS RINAVERSE",
    category: "rinaverse",
    route: "/rinaverse/communications",
    runtimeBoundary: false,
    lifecycle: "alpha",
  },
  {
    key: "rinaverse.business_suite",
    name: "RI BUSINESS SUITE RINAVERSE",
    category: "rinaverse",
    route: "/rinaverse/business-suite",
    runtimeBoundary: false,
    lifecycle: "alpha",
  },
  {
    key: "rinaverse.marketplace",
    name: "RI MARKETPLACE RINAVERSE",
    category: "rinaverse",
    route: "/rinaverse/marketplace",
    runtimeBoundary: false,
    lifecycle: "alpha",
  },
  {
    key: "rinaverse.character",
    name: "RI CHARACTER RINAVERSE",
    category: "rinaverse",
    route: "/rinaverse/character",
    runtimeBoundary: false,
    lifecycle: "alpha",
  },
  {
    key: "rinaverse.artificial",
    name: "RI ARTIFICIAL RINAVERSE",
    category: "rinaverse",
    route: "/rinaverse/artificial",
    runtimeBoundary: false,
    lifecycle: "concept",
  },

  {
    key: "industry.salon",
    name: "RI SALON RINAVERSE",
    category: "industry-rinaverse",
    route: "/rinaverse/salon",
    runtimeBoundary: false,
    lifecycle: "beta",
  },
  {
    key: "industry.jewellery",
    name: "RI JEWELLERY RINAVERSE",
    category: "industry-rinaverse",
    route: "/rinaverse/jewellery",
    runtimeBoundary: false,
    lifecycle: "alpha",
  },
  {
    key: "industry.automotive",
    name: "RI AUTOMOTIVE RINAVERSE",
    category: "industry-rinaverse",
    route: "/rinaverse/automotive",
    runtimeBoundary: false,
    lifecycle: "alpha",
  },
  {
    key: "industry.landscape",
    name: "RI LANDSCAPE RINAVERSE",
    category: "industry-rinaverse",
    route: "/rinaverse/landscape",
    runtimeBoundary: false,
    lifecycle: "alpha",
  },

  {
    key: "integration.shopify",
    name: "RI SHOPIFY RINAVERSE",
    category: "integration-rinaverse",
    route: "/rinaverse/integrations/shopify",
    runtimeBoundary: false,
    lifecycle: "alpha",
    trademarkReview: true,
  },
  {
    key: "integration.wix",
    name: "RI WIX RINAVERSE",
    category: "integration-rinaverse",
    route: "/rinaverse/integrations/wix",
    runtimeBoundary: false,
    lifecycle: "alpha",
    trademarkReview: true,
  },
  {
    key: "integration.chatgpt",
    name: "RI CHATGPT RINAVERSE",
    category: "integration-rinaverse",
    route: "/rinaverse/integrations/chatgpt",
    runtimeBoundary: false,
    lifecycle: "alpha",
    trademarkReview: true,
  },
  {
    key: "integration.shiprocket",
    name: "RI SHIPROCKET RINAVERSE",
    category: "integration-rinaverse",
    route: "/rinaverse/integrations/shiprocket",
    runtimeBoundary: false,
    lifecycle: "beta",
    trademarkReview: true,
  },
  {
    key: "integration.delhivery",
    name: "RI DELHIVERY RINAVERSE",
    category: "integration-rinaverse",
    route: "/rinaverse/integrations/delhivery",
    runtimeBoundary: false,
    lifecycle: "beta",
    trademarkReview: true,
  },
  {
    key: "integration.whatsapp",
    name: "RI WHATSAPP RINAVERSE",
    category: "integration-rinaverse",
    route: "/rinaverse/integrations/whatsapp",
    runtimeBoundary: false,
    lifecycle: "alpha",
    trademarkReview: true,
  },
  {
    key: "integration.ads_manager",
    name: "RI ADS MANAGER RINAVERSE",
    category: "integration-rinaverse",
    route: "/rinaverse/integrations/ads-manager",
    runtimeBoundary: false,
    lifecycle: "alpha",
    trademarkReview: true,
  },
] as const satisfies readonly RinadsBrandEntry[];

export type RinadsBrandKey = (typeof brandRegistry)[number]["key"];

export function getBrandEntry(key: RinadsBrandKey) {
  return brandRegistry.find((entry) => entry.key === key);
}
