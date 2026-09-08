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
    status: "available",
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
    name: "Nursery",
    type: "Landscape OS",
    headline: "Nursery and landscaping operations.",
    summary:
      "Live vertical template for nursery inventory, projects, and customer work — powered by Business OS.",
    capabilities: ["Live inventory", "Project work", "Customer CRM", "Field operations", "Growth"],
    status: "available",
  },
  {
    slug: "salon",
    name: "Salon",
    type: "Salon OS",
    headline: "Salon appointments, clients, and growth.",
    summary:
      "Booking, clients, services, and marketing — vertical configuration on the RINADS core.",
    capabilities: ["Appointments", "Clients", "Services menu", "Loyalty", "Campaigns"],
    status: "coming",
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
  "Nursery",
  "Salon",
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
