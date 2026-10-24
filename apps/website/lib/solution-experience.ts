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
    publicName: "Retail",
    signature: "Retail Operations Workspace",
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
    demoLabel: "RI LANDSCAPE RINASPACE demo",
    demoSummary:
      "An Industry RINASPACE for nursery inventory, customer work, projects, fulfilment, and field operations on the shared RINADS core.",
    rinpoPrompt:
      "Show me how RI LANDSCAPE RINASPACE can run nursery inventory, landscaping projects, customers, and delivery workflows.",
    statusNote: "Preview",
  },
  salon: {
    slug: "salon",
    publicName: "RI SALON RINASPACE",
    signature: "RI SALON RINASPACE",
    foundation: ["Business", "Automation", "RINADS Intelligence", "RINPO Runtime", "RI ID + RI SPACE"],
    workflow: ["Booking", "Calendar", "Client", "Service", "POS", "Loyalty", "Campaign", "Review"],
    demoLabel: "RI SALON RINASPACE product experience",
    demoSummary:
      "Salon operations on RINADS — booking, clients, services, POS, loyalty, campaigns, communications, reviews, and RINPO-assisted workflows.",
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
    demoLabel: "RI JEWELLERY RINASPACE concept",
    demoSummary:
      "A planned Industry RINASPACE focused on product presentation, appointments, customer journeys, commerce, and high-trust fulfilment.",
    rinpoPrompt:
      "Show me how RI JEWELLERY RINASPACE could support products, appointments, CRM, content, and fulfilment.",
    statusNote: "Roadmap",
  },
  logistics: {
    slug: "logistics",
    publicName: "RI LOGISTICS",
    signature: "RI LOGISTICS",
    foundation: ["Automation", "Business", "RINADS Intelligence", "RINPO Runtime"],
    workflow: ["Order", "Shipment", "Carrier", "Tracking", "Exception", "Delivery", "Return"],
    demoLabel: "RI LOGISTICS configuration concept",
    demoSummary:
      "A planned provider-neutral logistics configuration for shipment operations, exception handling, delivery orchestration, and customer follow-up.",
    rinpoPrompt:
      "Show me how RI LOGISTICS could support shipment control, carrier operations, exceptions, delivery, and returns.",
    statusNote: "Roadmap",
  },
  healthcare: {
    slug: "healthcare",
    publicName: "Healthcare",
    signature: "Practice Operations Configuration",
    foundation: ["Business", "Automation", "RINADS Intelligence", "RI ID + RI SPACE"],
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
    publicName: "RI AUTOMOTIVE RINASPACE",
    signature: "RI AUTOMOTIVE RINASPACE",
    foundation: ["Business", "Commerce", "Automation", "RINPO"],
    workflow: ["Booking", "Vehicle", "Job", "Parts", "Invoice", "Follow-up"],
    demoLabel: "RI AUTOMOTIVE RINASPACE concept",
    demoSummary:
      "A planned Industry RINASPACE for service scheduling, customer journeys, vehicles, parts, and follow-ups on the shared RINADS core. Not generally available.",
    rinpoPrompt:
      "Show me how RI AUTOMOTIVE RINASPACE could support jobs, customers, vehicles, parts, and follow-ups.",
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
