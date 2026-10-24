export type SolutionExperienceKey =
  | "retail"
  | "nursery"
  | "salon"
  | "jewellery"
  | "logistics"
  | "healthcare"
  | "automotive";

export type SolutionExperienceConfig = {
  slug: SolutionExperienceKey;
  publicName: string;
  signature: string;
  foundation: readonly string[];
  workflow: readonly string[];
  demoLabel: string;
  demoSummary: string;
  rinpoPrompt: string;
  statusNote: string;
};

export const SOLUTION_EXPERIENCES: Record<SolutionExperienceKey, SolutionExperienceConfig> = {
  retail: {
    slug: "retail",
    publicName: "Retail RINASPACE",
    signature: "Retail RINASPACE",
    foundation: ["Business", "Commerce", "Growth", "Automation"],
    workflow: ["Catalogue", "Inventory", "Storefront", "Order", "Payment", "Customer", "Campaign"],
    demoLabel: "Retail configuration demo",
    demoSummary:
      "A retail configuration that connects products, stock, orders, customers, and growth on the shared RINADS core.",
    rinpoPrompt:
      "Show me how RINADS can connect inventory, orders, customers, and marketing for a retail business.",
    statusNote: "Preview",
  },
  nursery: {
    slug: "nursery",
    publicName: "RI LANDSCAPE RINASPACE",
    signature: "RI LANDSCAPE RINASPACE",
    foundation: ["Business", "Commerce", "Automation", "RINPO"],
    workflow: ["Inventory", "Quote", "Project", "Field work", "Order", "Delivery", "Customer follow-up"],
    demoLabel: "Landscape & Nursery demo",
    demoSummary:
      "A shared-core configuration for nursery inventory, customer work, projects, fulfilment, and field operations.",
    rinpoPrompt:
      "Show me how RINADS can run nursery inventory, landscaping projects, customers, and delivery workflows.",
    statusNote: "Preview",
  },
  salon: {
    slug: "salon",
    publicName: "RI SALON RINASPACE",
    signature: "RI SALON RINASPACE",
    foundation: ["Business", "Automation", "RINADS INTELLIGENCE", "RINADS Platform"],
    workflow: ["Booking", "Calendar", "Client", "Service", "POS", "Loyalty", "Campaign", "Review"],
    demoLabel: "RI SALON RINASPACE pilot experience",
    demoSummary:
      "Salon operations on RINADS — booking, clients, services, POS, loyalty, campaigns, communications, reviews, and RINPO-assisted workflows. R GLOW is the current pilot implementation name.",
    rinpoPrompt:
      "Show me how RI SALON RINASPACE handles appointments, clients, POS, loyalty, campaigns, and RINPO-assisted salon operations.",
    statusNote: "Pilot",
  },
  jewellery: {
    slug: "jewellery",
    publicName: "RI JEWELLERY RINASPACE",
    signature: "RI JEWELLERY RINASPACE",
    foundation: ["Commerce", "Business", "Growth", "RINPO"],
    workflow: ["Collection", "Product", "Appointment", "Customer", "Order", "High-value fulfilment", "Follow-up"],
    demoLabel: "Jewellery configuration concept",
    demoSummary:
      "A planned jewellery configuration focused on product presentation, appointments, customer journeys, commerce, and high-trust fulfilment.",
    rinpoPrompt:
      "Show me how a jewellery business could use RINADS for products, appointments, CRM, content, and fulfilment.",
    statusNote: "Roadmap",
  },
  logistics: {
    slug: "logistics",
    publicName: "Logistics RINASPACE",
    signature: "Logistics RINASPACE",
    foundation: ["Automation", "Business", "RINADS INTELLIGENCE", "RINPO"],
    workflow: ["Order", "Shipment", "Carrier", "Tracking", "Exception", "Delivery", "Return"],
    demoLabel: "Logistics configuration concept",
    demoSummary:
      "A planned vertical configuration around provider-neutral shipment operations, exception handling, and customer follow-up.",
    rinpoPrompt:
      "Show me how a logistics business could use RINADS for shipment control, carrier operations, exceptions, and returns.",
    statusNote: "Roadmap",
  },
  healthcare: {
    slug: "healthcare",
    publicName: "Healthcare RINASPACE",
    signature: "Healthcare RINASPACE",
    foundation: ["Business", "Automation", "RINADS INTELLIGENCE", "RINADS Platform"],
    workflow: ["Schedule", "Visit flow", "Team task", "Follow-up", "Communication", "Operations review"],
    demoLabel: "Healthcare operations concept",
    demoSummary:
      "A planned operational configuration for scheduling, team workflows, follow-ups, and practice administration. It is not presented as a clinical decision system.",
    rinpoPrompt:
      "Show me how RINADS could support non-clinical healthcare operations such as scheduling, follow-ups, and team workflows.",
    statusNote: "Roadmap · non-clinical operations scope",
  },
  automotive: {
    slug: "automotive",
    publicName: "Automotive",
    signature: "Not in the November launch set",
    foundation: ["Business", "Commerce", "Automation", "RINPO"],
    workflow: ["Booking", "Vehicle", "Job", "Parts", "Invoice", "Follow-up"],
    demoLabel: "Automotive configuration concept",
    demoSummary:
      "A planned configuration for service scheduling, customers, parts, and follow-ups on the shared RINADS core. Not generally available.",
    rinpoPrompt:
      "Show me how an automotive service business could use RINADS for jobs, customers, parts, and follow-ups.",
    statusNote: "Roadmap",
  },
};

export function getSolutionExperience(slug: string): SolutionExperienceConfig | null {
  const key = slug === "landscape" ? "nursery" : slug;
  if (key in SOLUTION_EXPERIENCES) {
    return SOLUTION_EXPERIENCES[key as SolutionExperienceKey];
  }
  return null;
}
