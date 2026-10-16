/**
 * Authoritative industry / vertical solution catalog.
 * Aligns status with product truth — never softer than production posture.
 */
import type { ProductStatusValue } from "@/lib/product-status";
import { PRODUCT_STATUS_META } from "@/lib/product-status";

export type SolutionTier = "commercial" | "future";

export type SolutionCatalogEntry = {
  slug: string;
  industry: string;
  /** Plain-language outcome for cards */
  outcome: string;
  /** Underlying RINADS systems shown on cards */
  poweredBy: readonly string[];
  href: string;
  ctaLabel: string;
  status: ProductStatusValue;
  tier: SolutionTier;
  /** Sort weight — lower first (depth-first: salon, retail, nursery…) */
  depthOrder: number;
};

export const SOLUTION_CATALOG: SolutionCatalogEntry[] = [
  {
    slug: "salon",
    industry: "Salon",
    outcome:
      "Appointments, customers, staff, POS, follow-ups and growth from one connected workspace.",
    poweredBy: ["R GLOW", "Business OS", "RINPO"],
    href: "/solutions/salon",
    ctaLabel: "Explore Salon OS",
    status: "available_configuration",
    tier: "commercial",
    depthOrder: 1,
  },
  {
    slug: "retail",
    industry: "Retail",
    outcome: "Catalogue, inventory, storefront, orders, payments and customer growth.",
    poweredBy: ["Business OS", "Commerce OS", "RINPO"],
    href: "/solutions/retail",
    ctaLabel: "Explore Retail",
    status: "prototype_demo",
    tier: "commercial",
    depthOrder: 2,
  },
  {
    slug: "nursery",
    industry: "Landscape & Nursery",
    outcome: "Inventory, projects, field work, fulfilment and customer follow-up.",
    poweredBy: ["Business OS", "Commerce OS", "Logistics OS", "RINPO"],
    href: "/solutions/nursery",
    ctaLabel: "Explore Landscape & Nursery",
    status: "prototype_demo",
    tier: "commercial",
    depthOrder: 3,
  },
  {
    slug: "jewellery",
    industry: "Jewellery",
    outcome: "Collections, appointments, CRM, brand content and high-trust fulfilment.",
    poweredBy: ["Commerce OS", "Business OS", "RINPO"],
    href: "/solutions/jewellery",
    ctaLabel: "Explore Jewellery",
    status: "coming_soon",
    tier: "future",
    depthOrder: 4,
  },
  {
    slug: "automotive",
    industry: "Automotive",
    outcome: "Service operations, customers, parts and follow-ups on the shared RINADS core.",
    poweredBy: ["Business OS", "Commerce OS", "RINPO"],
    href: "/solutions",
    ctaLabel: "Talk about Automotive",
    status: "coming_soon",
    tier: "future",
    depthOrder: 5,
  },
  {
    slug: "healthcare",
    industry: "Healthcare",
    outcome:
      "Scheduling, team workflows and follow-ups for non-clinical practice operations.",
    poweredBy: ["Business OS", "Automation OS", "RINPO"],
    href: "/solutions/healthcare",
    ctaLabel: "Explore Healthcare",
    status: "private_preview",
    tier: "future",
    depthOrder: 6,
  },
  {
    slug: "logistics",
    industry: "Logistics",
    outcome: "Shipments, exceptions, carriers and customer delivery follow-up.",
    poweredBy: ["Logistics OS", "Business OS", "RINPO"],
    href: "/solutions/logistics",
    ctaLabel: "Explore Logistics",
    status: "coming_soon",
    tier: "future",
    depthOrder: 7,
  },
];

export function getSolution(slug: string): SolutionCatalogEntry | undefined {
  return SOLUTION_CATALOG.find((item) => item.slug === slug);
}

export function getSolutionsByTier(tier: SolutionTier): SolutionCatalogEntry[] {
  return SOLUTION_CATALOG.filter((item) => item.tier === tier).sort(
    (a, b) => a.depthOrder - b.depthOrder,
  );
}

export function getSolutionsSortedByDepth(): SolutionCatalogEntry[] {
  return [...SOLUTION_CATALOG].sort((a, b) => a.depthOrder - b.depthOrder);
}

export function solutionStatusNote(status: ProductStatusValue): string {
  return PRODUCT_STATUS_META[status].label;
}

/** Legacy VERTICAL_AVAILABILITY shape (slugs with existing solution pages). */
export type VerticalAvailability = {
  slug: string;
  status: ProductStatusValue;
  tier: SolutionTier;
};

const PAGE_SLUGS = new Set([
  "retail",
  "salon",
  "nursery",
  "jewellery",
  "healthcare",
  "logistics",
]);

export const VERTICAL_AVAILABILITY: VerticalAvailability[] = SOLUTION_CATALOG.filter((s) =>
  PAGE_SLUGS.has(s.slug),
).map(({ slug, status, tier }) => ({ slug, status, tier }));

export function getVerticalAvailability(slug: string): VerticalAvailability {
  return (
    VERTICAL_AVAILABILITY.find((item) => item.slug === slug) ?? {
      slug,
      status: "coming_soon" as const,
      tier: "future" as const,
    }
  );
}
