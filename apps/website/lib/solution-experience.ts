export type SolutionExperienceKey =
  | "retail"
  | "nursery"
  | "salon"
  | "jewellery"
  | "logistics"
  | "healthcare";

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
    foundation: ["Business OS", "Commerce OS", "Marketing OS", "Automation OS"],
    workflow: ["Catalogue", "Inventory", "Storefront", "Order", "Payment", "Customer", "Campaign"],
    demoLabel: "Retail configuration demo",
    demoSummary: "A retail configuration that connects products, stock, orders, customers, and growth on the shared RINADS core.",
    rinpoPrompt: "Show me how RINADS can connect inventory, orders, customers, and marketing for a retail business.",
    statusNote: "Available configuration",
  },
  nursery: {
    slug: "nursery",
    publicName: "Landscape & Nursery",
    signature: "Landscape & Nursery Operations",
    foundation: ["Business OS", "Commerce OS", "Logistics OS", "Automation OS"],
    workflow: ["Inventory", "Quote", "Project", "Field work", "Order", "Delivery", "Customer follow-up"],
    demoLabel: "Landscape & Nursery demo",
    demoSummary: "A shared-core configuration for nursery inventory, customer work, projects, fulfilment, and field operations.",
    rinpoPrompt: "Show me how RINADS can run nursery inventory, landscaping projects, customers, and delivery workflows.",
    statusNote: "Available configuration",
  },
  salon: {
    slug: "salon",
    publicName: "Salon / R GLOW",
    signature: "R GLOW · Salon Operating System",
    foundation: ["Business OS", "Automation OS", "RINADS Intelligence", "RINADS Cloud"],
    workflow: ["Booking", "Calendar", "Client", "Service", "POS", "Loyalty", "Campaign", "Review"],
    demoLabel: "R GLOW product experience",
    demoSummary: "Salon operations on RINADS — booking, clients, services, POS, loyalty, campaigns, communications, reviews, and RINPO-assisted workflows.",
    rinpoPrompt: "Show me how R GLOW handles appointments, clients, POS, loyalty, campaigns, and RINPO-assisted salon operations.",
    statusNote: "Product code built · production cutover still requires deployment and live credentials",
  },
  jewellery: {
    slug: "jewellery",
    publicName: "Jewellery",
    signature: "High-Trust Jewellery Experience",
    foundation: ["Commerce OS", "Creative OS", "Business OS", "Logistics OS"],
    workflow: ["Collection", "Product", "Appointment", "Customer", "Order", "High-value fulfilment", "Follow-up"],
    demoLabel: "Jewellery configuration concept",
    demoSummary: "A planned jewellery configuration focused on product presentation, appointments, customer journeys, commerce, and high-trust fulfilment.",
    rinpoPrompt: "Show me how a jewellery business could use RINADS for products, appointments, CRM, content, and fulfilment.",
    statusNote: "Coming soon",
  },
  logistics: {
    slug: "logistics",
    publicName: "Logistics",
    signature: "Logistics Operations Configuration",
    foundation: ["Logistics OS", "Business OS", "Automation OS", "RINADS Intelligence"],
    workflow: ["Order", "Shipment", "Carrier", "Tracking", "Exception", "Delivery", "Return"],
    demoLabel: "Logistics configuration concept",
    demoSummary: "A planned vertical configuration around provider-neutral shipment operations, exception handling, and customer follow-up.",
    rinpoPrompt: "Show me how a logistics business could use RINADS for shipment control, carrier operations, exceptions, and returns.",
    statusNote: "Coming soon",
  },
  healthcare: {
    slug: "healthcare",
    publicName: "Healthcare",
    signature: "Practice Operations Configuration",
    foundation: ["Business OS", "Automation OS", "RINADS Intelligence", "RINADS Cloud"],
    workflow: ["Schedule", "Visit flow", "Team task", "Follow-up", "Communication", "Operations review"],
    demoLabel: "Healthcare operations concept",
    demoSummary: "A planned operational configuration for scheduling, team workflows, follow-ups, and practice administration. It is not presented as a clinical decision system.",
    rinpoPrompt: "Show me how RINADS could support non-clinical healthcare operations such as scheduling, follow-ups, and team workflows.",
    statusNote: "Coming soon · non-clinical operations scope",
  },
};

export function getSolutionExperience(slug: string): SolutionExperienceConfig | null {
  if (slug in SOLUTION_EXPERIENCES) {
    return SOLUTION_EXPERIENCES[slug as SolutionExperienceKey];
  }
  return null;
}
