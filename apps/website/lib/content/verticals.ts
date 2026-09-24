import type { VerticalContent } from "./types";

export const VERTICALS: VerticalContent[] = [
  {
    slug: "retail",
    name: "Retail",
    type: "Retail OS",
    headline: "Retail operations on the RINADS core.",
    summary:
      "Catalogue, inventory, storefront, orders, and customer growth — configured for retail, not rebuilt as a separate platform.",
    capabilities: ["Catalogue & inventory", "Storefront", "Orders & payments", "CRM & loyalty", "Marketing automation"],
    status: "coming",
  },
  {
    slug: "jewellery",
    name: "Jewellery",
    type: "Jewellery OS",
    headline: "Jewellery commerce with precision operations.",
    summary:
      "High-trust retail workflows — products, collections, appointments, and brand storytelling on Business OS + Commerce OS.",
    capabilities: ["Collections", "Product studio", "Appointments", "CRM", "Brand content"],
    status: "coming",
  },
  {
    slug: "nursery",
    name: "Landscape & Nursery",
    type: "Landscape OS",
    headline: "Landscape and nursery operations on the RINADS core.",
    summary:
      "Nursery inventory, projects, and customer work configured on Business OS — currently shown as a demo / configuration path.",
    capabilities: ["Inventory", "Quotes & project work", "Customer CRM", "Field operations", "Orders & delivery", "Growth"],
    status: "coming",
  },
  {
    slug: "salon",
    name: "Salon / R GLOW",
    type: "Salon OS",
    headline: "Run salon operations with R GLOW.",
    summary:
      "Appointments, clients, services, POS, loyalty, campaigns, communications, and reviews — a salon vertical on the shared RINADS core.",
    capabilities: ["Appointments & calendar", "Clients & notes", "Services & staff", "POS & refunds", "Loyalty", "Campaigns", "Communications", "Reviews & recovery"],
    status: "available",
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    type: "Clinic OS",
    headline: "Practice operations with intelligent flow.",
    summary:
      "Patient scheduling, follow-ups, and practice work — configured carefully on the shared platform core.",
    capabilities: ["Scheduling", "Patient flow", "Follow-ups", "Team work", "Analytics"],
    status: "coming",
  },
  {
    slug: "logistics",
    name: "Logistics",
    type: "Logistics OS",
    headline: "Provider-neutral logistics control.",
    summary:
      "Orders, shipments, couriers, 3PL, tracking, and exceptions — one control tower architecture.",
    capabilities: ["Control tower", "Courier & 3PL", "Tracking", "Returns", "Exceptions"],
    status: "coming",
  },
];

export const VERTICAL_EXAMPLES = [
  "Retail",
  "Jewellery",
  "Landscape & Nursery",
  "Salon / R GLOW",
  "Healthcare",
  "Restaurant",
  "Real Estate",
  "Agency",
  "Logistics",
  "Custom",
] as const;

export function getVertical(slug: string): VerticalContent | null {
  return VERTICALS.find((v) => v.slug === slug) ?? null;
}
