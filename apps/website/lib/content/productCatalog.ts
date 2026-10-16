/**
 * Authoritative product catalog for marketing surfaces.
 * Status changes here must drive Homepage, Platform, Solutions, Pricing, and Nav.
 */
import type { ProductStatusValue } from "@/lib/product-status";
import { PRODUCT_STATUS_META } from "@/lib/product-status";

export type ProductCommercialPriority = "primary" | "secondary" | "foundation";

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  href: string;
  description: string;
  status: ProductStatusValue;
  commercialPriority: ProductCommercialPriority;
  /** Homepage "Available / Configurable Now" vs preview group */
  availabilityGroup: "now" | "preview";
  /** Outcome card mapping on homepage */
  outcomeId?:
    | "run-business"
    | "sell-more"
    | "grow-customers"
    | "automate-work"
    | "build-software"
    | "train-team";
};

export const PRODUCT_CATALOG: CatalogProduct[] = [
  {
    id: "business-os",
    slug: "business-os",
    name: "Business OS",
    href: "/platform/business-os",
    description: "Customers, tasks, teams, money and daily operations.",
    status: "available_configuration",
    commercialPriority: "primary",
    availabilityGroup: "now",
    outcomeId: "run-business",
  },
  {
    id: "commerce-os",
    slug: "commerce-os",
    name: "Commerce OS",
    href: "/platform/commerce-os",
    description: "Products, orders, customers, payments and fulfilment.",
    status: "available_configuration",
    commercialPriority: "primary",
    availabilityGroup: "now",
    outcomeId: "sell-more",
  },
  {
    id: "marketing-os",
    slug: "marketing-os",
    name: "Marketing OS",
    href: "/platform/marketing-os",
    description: "Campaigns, leads, follow-ups and CRM.",
    status: "prototype_demo",
    commercialPriority: "primary",
    availabilityGroup: "preview",
    outcomeId: "grow-customers",
  },
  {
    id: "automation-os",
    slug: "automation-os",
    name: "Automation OS",
    href: "/platform/automation-os",
    description: "Reduce repetitive tasks with controlled workflows.",
    status: "prototype_demo",
    commercialPriority: "secondary",
    availabilityGroup: "preview",
    outcomeId: "automate-work",
  },
  {
    id: "logistics-os",
    slug: "logistics-os",
    name: "Logistics OS",
    href: "/platform/logistics-os",
    description: "Move, track, and resolve delivery operations.",
    status: "prototype_demo",
    commercialPriority: "secondary",
    availabilityGroup: "preview",
  },
  {
    id: "creative-os",
    slug: "creative-os",
    name: "Creative OS",
    href: "/platform/creative-os",
    description: "Create content, image, video, and film.",
    status: "coming_soon",
    commercialPriority: "secondary",
    availabilityGroup: "preview",
  },
  {
    id: "build-os",
    slug: "build-os",
    name: "Build OS",
    href: "/platform/build-os",
    description: "Turn operational requirements into maintainable systems.",
    status: "prototype_demo",
    commercialPriority: "secondary",
    availabilityGroup: "preview",
    outcomeId: "build-software",
  },
  {
    id: "academy-os",
    slug: "academy-os",
    name: "Academy OS",
    href: "/platform/academy-os",
    description: "Practical capability connected to real work.",
    status: "prototype_demo",
    commercialPriority: "secondary",
    availabilityGroup: "preview",
    outcomeId: "train-team",
  },
  {
    id: "rinpo",
    slug: "rinpo",
    name: "RINPO",
    href: "/rinpo",
    description: "The persistent AI interface across RINADS.",
    status: "available_configuration",
    commercialPriority: "foundation",
    availabilityGroup: "now",
  },
  {
    id: "rinads-intelligence",
    slug: "rinads-intelligence",
    name: "RINADS Intelligence",
    href: "/platform/rinads-intelligence",
    description: "Context, recommendations, and governed AI behaviour.",
    status: "available_configuration",
    commercialPriority: "foundation",
    availabilityGroup: "now",
  },
  {
    id: "rinads-cloud",
    slug: "rinads-cloud",
    name: "RINADS Cloud",
    href: "/platform/rinads-cloud",
    description: "The connected platform foundation.",
    status: "available_configuration",
    commercialPriority: "foundation",
    availabilityGroup: "now",
  },
];

export function getProduct(slug: string): CatalogProduct | undefined {
  return PRODUCT_CATALOG.find((item) => item.slug === slug);
}

export function getProductsByGroup(group: "now" | "preview"): CatalogProduct[] {
  return PRODUCT_CATALOG.filter((item) => item.availabilityGroup === group);
}

export function getProductsByPriority(
  priority: ProductCommercialPriority,
): CatalogProduct[] {
  return PRODUCT_CATALOG.filter((item) => item.commercialPriority === priority);
}

/** Nav-compatible status label from catalog status. */
export function navStatusFromProduct(status: ProductStatusValue): string {
  return PRODUCT_STATUS_META[status].label;
}

/** Legacy OS_AVAILABILITY shape for gradual migration. */
export type OperatingSystemAvailability = {
  slug: string;
  name: string;
  href: string;
  status: ProductStatusValue;
  commercialPriority: ProductCommercialPriority;
};

export const OS_AVAILABILITY: OperatingSystemAvailability[] = PRODUCT_CATALOG.filter(
  (p) => p.id !== "rinpo",
).map(({ slug, name, href, status, commercialPriority }) => ({
  slug,
  name,
  href,
  status,
  commercialPriority,
}));

export function getOsAvailability(slug: string): OperatingSystemAvailability | undefined {
  return OS_AVAILABILITY.find((item) => item.slug === slug);
}
