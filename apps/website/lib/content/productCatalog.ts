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
  /** Homepage "now" vs roadmap/preview group */
  availabilityGroup: "now" | "preview";
  outcomeId?: "run" | "sell" | "grow" | "automate" | "build";
};

export const PRODUCT_CATALOG: CatalogProduct[] = [
  {
    id: "business",
    slug: "business",
    name: "Business",
    href: "/platform/business",
    description: "Customers, CRM, projects, finance and people.",
    status: "pilot",
    commercialPriority: "primary",
    availabilityGroup: "now",
    outcomeId: "run",
  },
  {
    id: "commerce",
    slug: "commerce",
    name: "Commerce",
    href: "/platform/commerce",
    description: "Products, orders, payments and fulfilment.",
    status: "pilot",
    commercialPriority: "primary",
    availabilityGroup: "now",
    outcomeId: "sell",
  },
  {
    id: "growth",
    slug: "growth",
    name: "Growth",
    href: "/platform/growth",
    description: "Leads, marketing, content and campaigns.",
    status: "preview",
    commercialPriority: "primary",
    availabilityGroup: "preview",
    outcomeId: "grow",
  },
  {
    id: "automation",
    slug: "automation",
    name: "Automation",
    href: "/platform/automation",
    description: "Workflows, agents, approvals and integrations.",
    status: "preview",
    commercialPriority: "secondary",
    availabilityGroup: "preview",
    outcomeId: "automate",
  },
  {
    id: "rinpo",
    slug: "rinpo",
    name: "RINPO",
    href: "/rinpo",
    description: "Business intelligence character and user-facing intelligence interface.",
    status: "pilot",
    commercialPriority: "foundation",
    availabilityGroup: "now",
  },
  {
    id: "intelligence",
    slug: "intelligence",
    name: "RINADS INTELLIGENCE",
    href: "/platform/intelligence",
    description: "Understand, reason, recommend, and orchestrate — providers remain replaceable.",
    status: "pilot",
    commercialPriority: "foundation",
    availabilityGroup: "now",
  },
  {
    id: "rinpo-runtime",
    slug: "rinpo-runtime",
    name: "RINPO RUNTIME",
    href: "/platform/rinpo-runtime",
    description: "Governed execution: agents, tools, workflows, permissions, approvals, audit.",
    status: "pilot",
    commercialPriority: "foundation",
    availabilityGroup: "now",
  },
  {
    id: "cloud",
    slug: "cloud",
    name: "RINADS Platform",
    href: "/platform/cloud",
    description: "Identity, tenant data, storage, APIs, events and infrastructure.",
    status: "pilot",
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

export function navStatusFromProduct(status: ProductStatusValue): string {
  return PRODUCT_STATUS_META[status].label;
}

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
