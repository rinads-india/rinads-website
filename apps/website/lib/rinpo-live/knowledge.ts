/**
 * Knowledge base for RINPO Live (Runway Documents).
 *
 * Facts are generated from the same typed catalogs that drive the website, so
 * the character can never be more optimistic than the site: a roadmap edition
 * is described as roadmap, and numeric prices appear only once
 * `COMMERCIAL_CONFIG.priceApproved` is true.
 *
 * Runway limits: plain text / markdown only, 50,000 tokens in total per avatar.
 * Hand-written documents (FAQ, corrections) live in
 * `content/rinpo-knowledge/*.md` and are passed in by the sync script.
 */

import { COMPANY_CONFIG } from "@/lib/content/companyConfig";
import {
  ACADEMY_PROGRAMS,
} from "@/lib/content/academy";
import {
  COMMERCIAL_CONFIG,
  PRICING_FAQ,
  PRICING_NOTES,
  PRICING_PLANS,
  type PricingPlan,
} from "@/lib/content/commercialConfig";
import { PRODUCT_CATALOG } from "@/lib/content/productCatalog";
import { SOLUTION_CATALOG } from "@/lib/content/solutionCatalog";
import {
  CLOUD_CAPABILITIES,
  INTELLIGENCE_CAPABILITIES,
  RINPO_CHANNELS,
  RINPO_ROLES,
  SERVICE_IMPLEMENTATION_GROUPS,
  SERVICE_LINES,
} from "@/lib/content/services";
import { PRODUCT_STATUS_META } from "@/lib/product-status";
import { PUBLIC_CONTACT } from "./personality";

export type KnowledgeDocument = {
  /** Stable key — the sync script uses it to find the existing Runway document. */
  key: string;
  /** Document name shown in the Runway portal. */
  name: string;
  content: string;
};

/** Runway allows 50,000 tokens per avatar; leave headroom for hand-written docs. */
export const KNOWLEDGE_TOKEN_LIMIT = 50_000;

/** Conservative estimate (≈3 chars/token) — Indic scripts tokenise worse than English. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

function bullets(items: readonly string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function companyOverview(): KnowledgeDocument {
  const { legalName, brandName, category, tagline, location, founder, contact, siteUrl } =
    COMPANY_CONFIG;
  const lines = [
    `# ${brandName} — company overview`,
    "",
    `${brandName} is operated by ${legalName}. Category: ${category}.`,
    `Tagline: "${tagline}"`,
    `${location.display} Location: ${location.city}, ${location.region}, ${location.country}.`,
    `Founder: ${founder.name}, ${founder.title}. ${founder.story}`,
    "",
    "## Contact",
    `- Phone: ${PUBLIC_CONTACT.phone}`,
    `- Website: ${PUBLIC_CONTACT.website} (${siteUrl})`,
    "- Contact and demo page: /company/contact",
    ...(contact.businessEmail ? [`- Business email: ${contact.businessEmail}`] : []),
    ...(contact.whatsappUrl ? ["- WhatsApp is available through the contact page."] : []),
    "",
    "Free consultations are available. Reach the team from India or globally.",
  ];
  return { key: "company", name: "RINADS — company overview", content: lines.join("\n") };
}

function productsAndAvailability(): KnowledgeDocument {
  const statusLines = Object.values(PRODUCT_STATUS_META).map(
    (meta) => `${meta.label}: ${meta.description}`,
  );
  const productLines = PRODUCT_CATALOG.map(
    (product) =>
      `- ${product.name} [${PRODUCT_STATUS_META[product.status].label}] — ${product.description} (page: ${product.href})`,
  );
  const lines = [
    "# RINADS products and their availability",
    "",
    "Every product has one of four public statuses. Always describe a product at its true status.",
    bullets(statusLines),
    "",
    "## Products",
    ...productLines,
    "",
    "## RINADS Intelligence",
    bullets(INTELLIGENCE_CAPABILITIES.map((c) => `${c.name}: ${c.description}`)),
    "",
    "## RINADS Cloud",
    bullets(CLOUD_CAPABILITIES.map((c) => `${c.name}: ${c.description}`)),
  ];
  return { key: "products", name: "RINADS — products and availability", content: lines.join("\n") };
}

function services(): KnowledgeDocument {
  const lineBlocks = SERVICE_LINES.map((line) =>
    [
      `## ${line.verb}: ${line.name}`,
      line.summary,
      `Offerings: ${line.offerings.join(", ")}.`,
    ].join("\n"),
  );
  const groupLines = SERVICE_IMPLEMENTATION_GROUPS.map(
    (group) => `- ${group.title}: ${group.summary}`,
  );
  const lines = [
    "# RINADS services",
    "",
    "RINADS Services help businesses Build, Grow, Automate, Create, Transform and Train on top of the AI Operating Platform. Page: /services",
    "",
    ...lineBlocks.flatMap((block) => [block, ""]),
    "## Implementation service groups",
    ...groupLines,
  ];
  return { key: "services", name: "RINADS — services", content: lines.join("\n") };
}

function editions(): KnowledgeDocument {
  // The catalog keeps legacy aliases (e.g. nursery → landscape) that share a page.
  const unique = SOLUTION_CATALOG.filter(
    (edition, index) =>
      SOLUTION_CATALOG.findIndex((other) => other.href === edition.href) === index,
  );
  const blocks = unique.map((edition) => {
    const status = PRODUCT_STATUS_META[edition.status];
    return [
      `## ${edition.editionName} — ${edition.industry} [${status.label}]`,
      edition.outcome,
      `Powered by: ${edition.poweredBy.join(", ")}.`,
      `Status meaning: ${status.description}`,
      `Page: ${edition.href}`,
    ].join("\n");
  });
  const lines = [
    "# RINADS industry editions",
    "",
    "Editions configure the shared RINADS core for an industry. Only describe an edition as usable today if its status says so.",
    "",
    ...blocks.flatMap((block) => [block, ""]),
  ];
  return { key: "editions", name: "RINADS — industry editions", content: lines.join("\n") };
}

function planLine(plan: PricingPlan): string {
  const price = (value: PricingPlan["monthlyPrice"]): string =>
    typeof value === "number" ? `${plan.currency} ${value}` : value === "contact" ? "contact sales" : "not announced";
  const numeric = COMMERCIAL_CONFIG.priceApproved
    ? ` Monthly: ${price(plan.monthlyPrice)}; annual: ${price(plan.annualPrice)}.`
    : "";
  return `- ${plan.name}: ${plan.description} Best for: ${plan.targetCustomer}. Includes: ${plan.includedOperatingSystems.join(", ")}. Implementation: ${plan.implementation}.${numeric}`;
}

function pricing(): KnowledgeDocument {
  const lines = [
    "# RINADS pricing and plans",
    "",
    COMMERCIAL_CONFIG.priceApproved
      ? "Published plan prices are listed below."
      : `Public prices are not published. ${COMMERCIAL_CONFIG.configuredPricingExplanation} Never quote a number. Offer a pricing estimate through the team (page: /company/contact).`,
    PRICING_NOTES.softwareVsServices,
    "",
    "## Plans",
    ...PRICING_PLANS.map(planLine),
    "",
    "## Pricing FAQ",
    ...PRICING_FAQ.flatMap((item) => [`Q: ${item.question}`, `A: ${item.answer}`, ""]),
  ];
  return { key: "pricing", name: "RINADS — pricing and plans", content: lines.join("\n") };
}

function rinpo(): KnowledgeDocument {
  const lines = [
    "# RINPO",
    "",
    "RINPO is the persistent AI Business Intelligence Character of RINADS — the front door to the platform.",
    "",
    "## Roles",
    bullets(RINPO_ROLES.map((role) => `${role.name}: ${role.description}`)),
    "",
    `## Channels\n${RINPO_CHANNELS.join(", ")}. Voice and phone are described at their true status on the RINPO pages (/rinpo).`,
    "",
    "## Academy",
    "Real Experience Academy teaches through real work: learn, practice, ship and certify, with RINPO as tutor. Page: /resources/academy",
    bullets(ACADEMY_PROGRAMS.map((program) => `${program.name}: ${program.summary}`)),
  ];
  return { key: "rinpo", name: "RINPO and Academy", content: lines.join("\n") };
}

/** Documents generated from website truth. */
export function buildGeneratedKnowledge(): KnowledgeDocument[] {
  return [
    companyOverview(),
    productsAndAvailability(),
    services(),
    editions(),
    pricing(),
    rinpo(),
  ];
}

/**
 * Generated + hand-written documents. `extra` maps a stable key to markdown
 * read from `content/rinpo-knowledge/`; blank entries are skipped.
 */
export function buildKnowledgeDocuments(
  extra: ReadonlyArray<{ key: string; name: string; content: string }> = [],
): KnowledgeDocument[] {
  const authored = extra.filter((doc) => doc.content.trim().length > 0);
  return [...buildGeneratedKnowledge(), ...authored];
}

export function totalKnowledgeTokens(documents: readonly KnowledgeDocument[]): number {
  return documents.reduce((sum, doc) => sum + estimateTokens(doc.content), 0);
}
