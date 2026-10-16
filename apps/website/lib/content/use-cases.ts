export type UseCaseEntry = {
  slug: string;
  title: string;
  summary: string;
  outcomes: string[];
  platformHref: string;
  platformLabel: string;
};

export const USE_CASES: UseCaseEntry[] = [
  {
    slug: "crm",
    title: "CRM for growing teams",
    summary: "Keep customers, conversations, and follow-ups on the Business pillar instead of a disconnected CRM silo.",
    outcomes: [
      "Single customer record connected to work and money modules.",
      "Follow-ups tied to real project and invoice context.",
      "RINPO can explain pipeline status inside permissions.",
    ],
    platformHref: "/platform/business",
    platformLabel: "Explore Business",
  },
  {
    slug: "lead-management",
    title: "Lead management",
    summary: "Capture, qualify, and route leads into governed workflows on the shared platform core.",
    outcomes: [
      "Leads connect to Growth campaigns and Business CRM.",
      "Assignment and reminders without shadow spreadsheets.",
      "Clear availability labels for what is production-ready today.",
    ],
    platformHref: "/platform/growth",
    platformLabel: "Explore Growth",
  },
  {
    slug: "customer-follow-up",
    title: "Customer follow-up",
    summary: "Automate reminders and human touchpoints with approvals where required.",
    outcomes: [
      "Triggers from orders, projects, or appointments.",
      "Notifications through platform channels — not invented integrations.",
      "Audit-friendly history when runtime paths exist.",
    ],
    platformHref: "/platform/automation",
    platformLabel: "Explore Automation",
  },
  {
    slug: "project-management",
    title: "Project management",
    summary: "Run delivery work alongside customers and billing on Business.",
    outcomes: [
      "Tasks and milestones linked to customer accounts.",
      "Invoices and time context stay in the same organisation.",
      "RINPO can surface blockers from permitted data.",
    ],
    platformHref: "/platform/business",
    platformLabel: "Explore Business",
  },
  {
    slug: "business-automation",
    title: "Business automation",
    summary: "Replace repetitive handoffs with workflows, agents, and approval gates.",
    outcomes: [
      "Event-driven automation through RINPO Runtime.",
      "Human approvals before high-risk mutations.",
      "Integrations declare live, beta, preview, or planned status.",
    ],
    platformHref: "/platform/automation",
    platformLabel: "Explore Automation",
  },
  {
    slug: "inventory-management",
    title: "Inventory management",
    summary: "Track stock across commerce and operations with shared catalogue context.",
    outcomes: [
      "Inventory signals feed Commerce and industry editions.",
      "Exceptions visible to operators — not hidden in side systems.",
      "Landscape & Nursery edition demonstrates configuration paths.",
    ],
    platformHref: "/platform/commerce",
    platformLabel: "Explore Commerce",
  },
  {
    slug: "marketing-automation",
    title: "Marketing automation",
    summary: "Plan campaigns and content on Growth with CRM-connected audiences.",
    outcomes: [
      "Campaigns respect audience permissions and consent posture.",
      "Content and creative work share organisation context.",
      "Measurement tied to real commerce and CRM signals where connected.",
    ],
    platformHref: "/platform/growth",
    platformLabel: "Explore Growth",
  },
  {
    slug: "ai-business-assistant",
    title: "AI business assistant",
    summary: "Use RINPO to understand, recommend, and prepare governed actions across the platform.",
    outcomes: [
      "Persistent interface across product surfaces.",
      "Intelligence layer with replaceable model providers.",
      "Execution only through Runtime tools and approvals.",
    ],
    platformHref: "/rinpo",
    platformLabel: "Meet RINPO",
  },
];

export function getUseCase(slug: string): UseCaseEntry | undefined {
  return USE_CASES.find((item) => item.slug === slug);
}
