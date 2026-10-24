/**
 * Authoritative RINADS Editions (industry solution) catalog.
 * Aligns status with product truth — never softer than production posture.
 */
import type { ProductStatusValue } from "@/lib/product-status";
import { PRODUCT_STATUS_META } from "@/lib/product-status";

export type SolutionTier = "commercial" | "future";

export type SolutionCatalogEntry = {
  slug: string;
  industry: string;
  editionName: string;
  outcome: string;
  poweredBy: readonly string[];
  href: string;
  ctaLabel: string;
  status: ProductStatusValue;
  tier: SolutionTier;
  depthOrder: number;
  /** When true, shown in primary Editions grid on homepage */
  publicEdition: boolean;
};

export const SOLUTION_CATALOG: SolutionCatalogEntry[] = [
  {
    slug: "salon",
    industry: "Salon",
    editionName: "RI SALON RINASPACE",
    outcome:
      "Appointments, customers, staff, POS, follow-ups and growth from one connected workspace.",
    poweredBy: ["RI SALON RINASPACE", "Business", "RINPO"],
    href: "/solutions/salon",
    ctaLabel: "Activate your RINASPACE",
    status: "pilot",
    tier: "commercial",
    depthOrder: 1,
    publicEdition: true,
  },
  {
    slug: "jewellery",
    industry: "Jewellery",
    editionName: "RI JEWELLERY RINASPACE",
    outcome: "Collections, appointments, CRM, brand content and high-trust fulfilment.",
    poweredBy: ["Commerce", "Business", "RINPO"],
    href: "/solutions/jewellery",
    ctaLabel: "Activate your RINASPACE",
    status: "roadmap",
    tier: "future",
    depthOrder: 2,
    publicEdition: true,
  },
  {
    slug: "automotive",
    industry: "Automotive",
    editionName: "Automotive RINASPACE",
    outcome: "Service operations, customers, parts and follow-ups on the shared RINADS core.",
    poweredBy: ["Business", "Commerce", "RINPO"],
    href: "/solutions/automotive",
    ctaLabel: "Activate your RINASPACE",
    status: "roadmap",
    tier: "future",
    depthOrder: 3,
    publicEdition: false,
  },
  {
    slug: "landscape",
    industry: "Landscape & Nursery",
    editionName: "RI LANDSCAPE RINASPACE",
    outcome: "Inventory, projects, field work, fulfilment and customer follow-up.",
    poweredBy: ["Business", "Commerce", "Automation", "RINPO"],
    href: "/solutions/landscape",
    ctaLabel: "Activate your RINASPACE",
    status: "preview",
    tier: "commercial",
    depthOrder: 4,
    publicEdition: true,
  },
  {
    slug: "nursery",
    industry: "Landscape & Nursery",
    editionName: "RI LANDSCAPE RINASPACE",
    outcome: "Inventory, projects, field work, fulfilment and customer follow-up.",
    poweredBy: ["Business", "Commerce", "Automation", "RINPO"],
    href: "/solutions/landscape",
    ctaLabel: "Activate your RINASPACE",
    status: "preview",
    tier: "commercial",
    depthOrder: 4,
    publicEdition: false,
  },
  {
    slug: "retail",
    industry: "Retail",
    editionName: "Retail RINASPACE",
    outcome: "Catalogue, inventory, storefront, orders, payments and customer growth.",
    poweredBy: ["Business", "Commerce", "RINPO"],
    href: "/solutions/retail",
    ctaLabel: "Activate your RINASPACE",
    status: "preview",
    tier: "commercial",
    depthOrder: 5,
    publicEdition: true,
  },
  {
    slug: "logistics",
    industry: "Logistics",
    editionName: "Logistics RINASPACE",
    outcome: "Shipments, exceptions, carriers and customer delivery follow-up.",
    poweredBy: ["Automation", "Business", "RINPO"],
    href: "/solutions/logistics",
    ctaLabel: "Activate your RINASPACE",
    status: "roadmap",
    tier: "future",
    depthOrder: 6,
    publicEdition: true,
  },
  {
    slug: "healthcare",
    industry: "Healthcare",
    editionName: "Healthcare RINASPACE",
    outcome:
      "Scheduling, team workflows and follow-ups for non-clinical practice operations.",
    poweredBy: ["Business", "Automation", "RINPO"],
    href: "/solutions/healthcare",
    ctaLabel: "Activate your RINASPACE",
    status: "roadmap",
    tier: "future",
    depthOrder: 99,
    publicEdition: false,
  },
];

export function getSolution(slug: string): SolutionCatalogEntry | undefined {
  return SOLUTION_CATALOG.find((item) => item.slug === slug);
}

export function getPublicEditions(): SolutionCatalogEntry[] {
  return SOLUTION_CATALOG.filter((item) => item.publicEdition).sort(
    (a, b) => a.depthOrder - b.depthOrder,
  );
}

export function getSolutionsByTier(tier: SolutionTier): SolutionCatalogEntry[] {
  return SOLUTION_CATALOG.filter((item) => item.tier === tier && item.publicEdition).sort(
    (a, b) => a.depthOrder - b.depthOrder,
  );
}

export function getSolutionsSortedByDepth(): SolutionCatalogEntry[] {
  return getPublicEditions();
}

export function solutionStatusNote(status: ProductStatusValue): string {
  return PRODUCT_STATUS_META[status].label;
}

export type VerticalAvailability = {
  slug: string;
  status: ProductStatusValue;
  tier: SolutionTier;
};

const PAGE_SLUGS = new Set([
  "retail",
  "salon",
  "nursery",
  "landscape",
  "jewellery",
  "healthcare",
  "logistics",
  "automotive",
]);

export const VERTICAL_AVAILABILITY: VerticalAvailability[] = SOLUTION_CATALOG.filter((s) =>
  PAGE_SLUGS.has(s.slug),
).map(({ slug, status, tier }) => ({ slug, status, tier }));

export function getVerticalAvailability(slug: string): VerticalAvailability {
  return (
    VERTICAL_AVAILABILITY.find((item) => item.slug === slug) ?? {
      slug,
      status: "roadmap" as const,
      tier: "future" as const,
    }
  );
}
