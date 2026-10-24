import type { VerticalContent } from "./types";

export const VERTICALS: VerticalContent[] = [
  {
    slug: "retail",
    name: "Retail RINASPACE",
    type: "Industry RINASPACE",
    headline: "Retail operations on the RINADS platform.",
    summary:
      "Catalogue, inventory, storefront, orders, and customer growth — configured as a Retail RINASPACE, not rebuilt as a separate platform.",
    capabilities: ["Catalogue & inventory", "Storefront", "Orders & payments", "CRM & loyalty", "Marketing automation"],
    status: "coming",
  },
  {
    slug: "jewellery",
    name: "RI JEWELLERY RINASPACE",
    type: "Industry RINASPACE",
    headline: "Jewellery commerce with precision operations.",
    summary:
      "High-trust retail workflows — products, collections, appointments, and brand storytelling. Coming soon on the shared RINADS platform.",
    capabilities: ["Collections", "Product studio", "Appointments", "CRM", "Brand content"],
    status: "coming",
  },
  {
    slug: "nursery",
    name: "RI LANDSCAPE RINASPACE",
    type: "Industry RINASPACE",
    headline: "Landscape and nursery operations on the RINADS platform.",
    summary:
      "Nursery inventory, projects, and customer work configured as RI LANDSCAPE RINASPACE — currently shown as a preview / configuration path.",
    capabilities: ["Inventory", "Quotes & project work", "Customer CRM", "Field operations", "Orders & delivery", "Growth"],
    status: "coming",
  },
  {
    slug: "salon",
    name: "RI SALON RINASPACE",
    type: "Industry RINASPACE",
    headline: "Run salon operations in RI SALON RINASPACE.",
    summary:
      "Appointments, clients, services, POS, loyalty, campaigns, communications, and reviews — a salon Industry RINASPACE on the shared RINADS platform. R GLOW is the current pilot implementation name, not the public brand.",
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
    name: "Healthcare RINASPACE",
    type: "Industry RINASPACE",
    headline: "Practice operations with intelligent flow.",
    summary:
      "Patient scheduling, follow-ups, and practice work — a planned Industry RINASPACE on the shared platform core. Not a clinical decision system.",
    capabilities: ["Scheduling", "Patient flow", "Follow-ups", "Team work", "Analytics"],
    status: "coming",
  },
  {
    slug: "logistics",
    name: "Logistics RINASPACE",
    type: "Industry RINASPACE",
    headline: "Provider-neutral logistics control.",
    summary:
      "Orders, shipments, couriers, 3PL, tracking, and exceptions — a coming-soon Industry RINASPACE, not a live logistics product.",
    capabilities: ["Control tower", "Courier & 3PL", "Tracking", "Returns", "Exceptions"],
    status: "coming",
  },
  {
    slug: "automotive",
    name: "Automotive",
    type: "Industry RINASPACE",
    headline: "Not in the November launch set.",
    summary:
      "This industry path is not part of the public launch story. The page redirects to Industry RINASPACES.",
    capabilities: ["Service scheduling", "Customers", "Parts & inventory", "Jobs & invoices", "Follow-ups"],
    status: "coming",
  },
];

export const VERTICAL_EXAMPLES = [
  "Retail",
  "Jewellery",
  "Landscape & Nursery",
  "Salon",
  "Healthcare",
  "Restaurant",
  "Real Estate",
  "Agency",
  "Logistics",
  "Custom",
] as const;

/** Public listings omit automotive — not part of the launch story. */
export const PUBLIC_VERTICALS = VERTICALS.filter((vertical) => vertical.slug !== "automotive");

export function getVertical(slug: string): VerticalContent | null {
  return VERTICALS.find((v) => v.slug === slug) ?? null;
}
