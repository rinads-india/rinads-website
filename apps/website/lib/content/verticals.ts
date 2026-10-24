import type { VerticalContent } from "./types";

export const VERTICALS: VerticalContent[] = [
  {
    slug: "retail",
    name: "Retail",
    type: "Industry configuration",
    headline: "Retail operations on the RINADS core.",
    summary:
      "Catalogue, inventory, storefront, orders, and customer growth — configured for retail, not rebuilt as a separate platform.",
    capabilities: ["Catalogue & inventory", "Storefront", "Orders & payments", "CRM & loyalty", "Marketing automation"],
    status: "coming",
  },
  {
    slug: "jewellery",
    name: "RI JEWELLERY RINASPACE",
    type: "Industry RINASPACE",
    headline: "Jewellery commerce with precision operations.",
    summary:
      "High-trust retail workflows — products, collections, appointments, customer journeys, commerce, storytelling, and fulfilment on the shared RINADS core.",
    capabilities: ["Collections", "Product studio", "Appointments", "CRM", "Brand content"],
    status: "coming",
  },
  {
    slug: "nursery",
    name: "RI LANDSCAPE RINASPACE",
    type: "Industry RINASPACE",
    headline: "Landscape and nursery operations on the RINADS core.",
    summary:
      "Nursery inventory, projects, field operations, customer work, orders, and delivery configured on the shared RINADS core — currently shown as a preview path.",
    capabilities: ["Inventory", "Quotes & project work", "Customer CRM", "Field operations", "Orders & delivery", "Growth"],
    status: "coming",
  },
  {
    slug: "salon",
    name: "RI SALON RINASPACE",
    type: "Industry RINASPACE",
    headline: "Run salon operations through RI SALON RINASPACE.",
    summary:
      "Appointments, clients, services, POS, loyalty, campaigns, communications, and reviews on the shared RINADS core, with RINPO as the Business Intelligence Character and RINPO Runtime behind supported execution.",
    capabilities: [
      "Appointments & calendar",
      "Clients & notes",
      "Services & staff",
      "POS & refunds",
      "Loyalty",
      "Campaigns",
      "Communications",
      "Reviews & recovery",
      "RINPO-assisted workflows",
    ],
    status: "available",
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    type: "Industry configuration",
    headline: "Practice operations with intelligent flow.",
    summary:
      "Non-clinical scheduling, follow-ups, and practice work — configured carefully on the shared platform core.",
    capabilities: ["Scheduling", "Patient flow", "Follow-ups", "Team work", "Analytics"],
    status: "coming",
  },
  {
    slug: "logistics",
    name: "RI LOGISTICS",
    type: "Industry configuration",
    headline: "Provider-neutral logistics control.",
    summary:
      "Orders, shipments, couriers, 3PL, tracking, returns, and exceptions — connected through a provider-neutral logistics control architecture.",
    capabilities: ["Control tower", "Courier & 3PL", "Tracking", "Returns", "Exceptions"],
    status: "coming",
  },
  {
    slug: "automotive",
    name: "RI AUTOMOTIVE RINASPACE",
    type: "Industry RINASPACE",
    headline: "Automotive operations on the shared RINADS core.",
    summary:
      "Customers, vehicles, enquiries, service work, parts, delivery, and follow-ups — a planned Industry RINASPACE, not a separate technology stack.",
    capabilities: ["Service scheduling", "Customers & vehicles", "Parts & inventory", "Jobs & invoices", "Follow-ups"],
    status: "coming",
  },
];

export const VERTICAL_EXAMPLES = [
  "Retail",
  "RI JEWELLERY RINASPACE",
  "RI LANDSCAPE RINASPACE",
  "RI SALON RINASPACE",
  "Healthcare",
  "Restaurant",
  "Real Estate",
  "Agency",
  "RI LOGISTICS",
  "Custom",
] as const;

export function getVertical(slug: string): VerticalContent | null {
  return VERTICALS.find((v) => v.slug === slug) ?? null;
}
