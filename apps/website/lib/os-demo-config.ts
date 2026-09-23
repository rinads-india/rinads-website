export type OperatingSystemDemoKey =
  | "business-os"
  | "commerce-os"
  | "marketing-os"
  | "logistics-os"
  | "creative-os"
  | "build-os"
  | "academy-os"
  | "automation-os";

export type OperatingSystemDemoConfig = {
  slug: OperatingSystemDemoKey;
  signature: string;
  demoLabel: string;
  demoSummary: string;
  workflow: readonly string[];
  rinpoPrompt: string;
  rinpoExample: string;
};

export const OPERATING_SYSTEM_DEMOS: Record<OperatingSystemDemoKey, OperatingSystemDemoConfig> = {
  "business-os": {
    slug: "business-os",
    signature: "Founder Command Center",
    demoLabel: "Business OS demo",
    demoSummary: "A single attention surface for customers, work, receivables, operations, and next actions.",
    workflow: ["Lead", "Customer", "Proposal", "Project", "Invoice", "Payment", "Follow-up"],
    rinpoPrompt: "Show me how RINPO can identify what needs attention inside Business OS.",
    rinpoExample: "Prioritize the leads with no follow-up, then review the overdue receivables.",
  },
  "commerce-os": {
    slug: "commerce-os",
    signature: "Commerce Operations Flow",
    demoLabel: "Commerce OS demo",
    demoSummary: "Products, inventory, storefront, orders, payment state, fulfilment, and customer activity in one flow.",
    workflow: ["Product", "Catalogue", "Storefront", "Order", "Payment", "Fulfilment", "Customer"],
    rinpoPrompt: "Show me how an order moves from product and checkout to fulfilment in Commerce OS.",
    rinpoExample: "Two popular variants are approaching their demo reorder threshold.",
  },
  "marketing-os": {
    slug: "marketing-os",
    signature: "Campaign Command Center",
    demoLabel: "Marketing OS demo",
    demoSummary: "Campaign state, channel activity, lead response, and content execution in one operating view.",
    workflow: ["Brief", "Audience", "Creative", "Launch", "Leads", "Follow-up", "Measure"],
    rinpoPrompt: "Show me how RINPO would diagnose a campaign inside Marketing OS.",
    rinpoExample: "Lead response is slowing while one channel is consuming most of the demo spend.",
  },
  "logistics-os": {
    slug: "logistics-os",
    signature: "Shipment Control Tower",
    demoLabel: "Logistics OS demo",
    demoSummary: "Shipment status, provider handoff, delivery exceptions, returns, and operational follow-up.",
    workflow: ["Order", "Pack", "Carrier", "In transit", "Delivery", "Exception", "Return"],
    rinpoPrompt: "Show me how RINPO can review delivery exceptions inside Logistics OS.",
    rinpoExample: "Three demo shipments need exception review before the next carrier handoff.",
  },
  "creative-os": {
    slug: "creative-os",
    signature: "AI Production Studio",
    demoLabel: "Creative OS experience demo",
    demoSummary: "Move a creative brief through concept, script, visual production, review, and publishing.",
    workflow: ["Brief", "Concept", "Script", "Image", "Video", "Voice", "Review", "Publish"],
    rinpoPrompt: "Walk me through an AI content production workflow in Creative OS.",
    rinpoExample: "The concept and script are ready; visual production is the next review gate.",
  },
  "build-os": {
    slug: "build-os",
    signature: "Software Factory",
    demoLabel: "Build OS experience demo",
    demoSummary: "Turn a requirement into a structured software build from discovery through deployment and monitoring.",
    workflow: ["Discovery", "PRD", "UX", "Architecture", "Build", "Test", "Deploy", "Monitor"],
    rinpoPrompt: "Show me how Build OS turns a business requirement into a software delivery plan.",
    rinpoExample: "The architecture is ready for review before implementation begins.",
  },
  "academy-os": {
    slug: "academy-os",
    signature: "Skill Graph + RINPO Tutor",
    demoLabel: "Academy OS experience demo",
    demoSummary: "Track learning progress through practice, real work, shipped projects, measurement, and certification.",
    workflow: ["Learn", "Practice", "Work", "Ship", "Measure", "Improve", "Certify"],
    rinpoPrompt: "Show me how RINPO can guide a learner through Academy OS.",
    rinpoExample: "The next useful step is a real project that applies the current skill module.",
  },
  "automation-os": {
    slug: "automation-os",
    signature: "Workflow + Approval + Audit",
    demoLabel: "Automation OS demo",
    demoSummary: "Model triggers, conditions, actions, approval gates, execution state, and traceability.",
    workflow: ["Trigger", "Condition", "Draft", "Approval", "Action", "Result", "Audit"],
    rinpoPrompt: "Show me how a governed workflow moves from trigger to approval and audit in Automation OS.",
    rinpoExample: "The workflow is waiting for approval before the higher-risk action can continue.",
  },
};

export function getOperatingSystemDemo(slug: string): OperatingSystemDemoConfig | null {
  if (slug in OPERATING_SYSTEM_DEMOS) {
    return OPERATING_SYSTEM_DEMOS[slug as OperatingSystemDemoKey];
  }
  return null;
}
