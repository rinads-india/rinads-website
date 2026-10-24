import { getSolution } from "@/lib/content/solutionCatalog";

export type RinpoExperienceState =
  | "closed"
  | "open"
  | "listening"
  | "thinking"
  | "responding"
  | "recommending"
  | "action-preview"
  | "awaiting-approval"
  | "executing"
  | "success"
  | "failure"
  | "audited";

export type RinpoSolutionIndustry =
  | "salon"
  | "jewellery"
  | "commerce"
  | "retail"
  | "landscape"
  | "automotive"
  | "logistics"
  | null;

export type RinpoPageContext = {
  area: string;
  prompt: string;
  suggestions: readonly string[];
  industry?: RinpoSolutionIndustry;
  /** Product / edition hints for solution routes */
  productHints?: readonly string[];
};

export const RINPO_STATE_LABELS: Record<RinpoExperienceState, string> = {
  closed: "Ready",
  open: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  responding: "Responding",
  recommending: "Recommendation ready",
  "action-preview": "Action preview",
  "awaiting-approval": "Awaiting approval",
  executing: "Executing",
  success: "Completed",
  failure: "Needs attention",
  audited: "Audited",
};

const DEFAULT_CONTEXT: RinpoPageContext = {
  area: "RINADS",
  prompt: "What would you like to run, build, grow, automate, or learn?",
  suggestions: [
    "What's happening in my business?",
    "Find what needs attention",
    "Build something",
    "Automate a workflow",
  ],
  industry: null,
};

const SOLUTION_INDUSTRY_BY_SLUG: Record<string, RinpoSolutionIndustry> = {
  salon: "salon",
  jewellery: "jewellery",
  retail: "retail",
  landscape: "landscape",
  nursery: "landscape",
  automotive: "automotive",
  logistics: "logistics",
  healthcare: null,
};

const CONTEXT_RULES: Array<{ test: (pathname: string) => boolean; context: RinpoPageContext }> = [
  {
    test: (pathname) => pathname === "/" || pathname === "",
    context: DEFAULT_CONTEXT,
  },
  {
    test: (pathname) =>
      pathname.startsWith("/platform/business-os") || pathname.startsWith("/platform/business"),
    context: {
      area: "Business",
      prompt: "Want me to show what needs attention in a business?",
      suggestions: [
        "What needs attention today?",
        "Show leads that need follow-up",
        "Review overdue work",
        "Explain the Business Intelligence Platform",
      ],
    },
  },
  {
    test: (pathname) =>
      pathname.startsWith("/platform/commerce-os") || pathname.startsWith("/platform/commerce"),
    context: {
      area: "Commerce",
      prompt: "Want to see how an order moves from product to fulfilment?",
      suggestions: [
        "Show the order flow",
        "What can RINPO do in commerce?",
        "Explain inventory intelligence",
        "How does fulfilment connect?",
      ],
    },
  },
  {
    test: (pathname) =>
      pathname.startsWith("/platform/marketing-os") || pathname.startsWith("/platform/growth"),
    context: {
      area: "Growth",
      prompt: "Want me to diagnose a campaign or map a growth workflow?",
      suggestions: [
        "Diagnose a campaign",
        "Plan a content workflow",
        "Explain attribution",
        "Show how CRM connects to marketing",
      ],
    },
  },
  {
    test: (pathname) =>
      pathname.startsWith("/platform/logistics-os") || pathname.startsWith("/solutions/logistics"),
    context: {
      area: "Logistics RINASPACE",
      prompt: "Want to see how RINADS handles shipments and exceptions?",
      suggestions: [
        "Show shipment exceptions",
        "Explain the control tower",
        "How do carriers connect?",
        "Show returns flow",
      ],
    },
  },
  {
    test: (pathname) => pathname.startsWith("/platform/creative-os"),
    context: {
      area: "Creative",
      prompt: "What would you like to create?",
      suggestions: [
        "Build an AI content workflow",
        "Plan an AI film",
        "Create a product-content pipeline",
        "Explain creative systems",
      ],
    },
  },
  {
    test: (pathname) => pathname.startsWith("/platform/build-os"),
    context: {
      area: "Build",
      prompt: "What software or system do you want to build?",
      suggestions: [
        "Turn an idea into a PRD",
        "Review an architecture",
        "Plan a software build",
        "Explain build capability",
      ],
    },
  },
  {
    test: (pathname) =>
      pathname.startsWith("/platform/academy-os") ||
      pathname.startsWith("/academy") ||
      pathname.startsWith("/labs"),
    context: {
      area: "RI LABS",
      prompt: "What would you like to learn or train your team on?",
      suggestions: [
        "Help me choose a program",
        "Explain the learning path",
        "Train my team on RINADS INTELLIGENCE",
        "Show how RINPO tutors",
      ],
    },
  },
  {
    test: (pathname) =>
      pathname.startsWith("/platform/automation-os") || pathname.startsWith("/platform/automation"),
    context: {
      area: "Automation",
      prompt: "What repetitive work do you want to automate?",
      suggestions: [
        "Map an approval workflow",
        "Automate lead follow-up",
        "Connect two business systems",
        "Explain governed automation",
      ],
    },
  },
  {
    test: (pathname) =>
      pathname.startsWith("/platform/rinads-intelligence") ||
      pathname.startsWith("/platform/intelligence"),
    context: {
      area: "RINADS INTELLIGENCE",
      prompt: "Want to see how RINADS turns signals into recommendations?",
      suggestions: [
        "Explain business context",
        "Show a recommendation flow",
        "How do approvals work?",
        "How are AI actions audited?",
      ],
    },
  },
  {
    test: (pathname) =>
      pathname.startsWith("/platform/rinads-cloud") || pathname.startsWith("/platform/cloud"),
    context: {
      area: "RINADS Platform",
      prompt: "What part of the platform foundation do you want to understand?",
      suggestions: [
        "Explain tenant isolation",
        "Show the API layer",
        "How does the intelligence gateway fit?",
        "Explain events and audit",
      ],
    },
  },
  {
    test: (pathname) => pathname.startsWith("/rinaspace") || pathname.startsWith("/solutions"),
    context: {
      area: "Industry RINASPACES",
      prompt: "Tell me your industry and I can map it to RINADS.",
      suggestions: [
        "Map RINADS to my business",
        "Which solution fits me?",
        "Show an industry workflow",
        "Explain custom configuration",
      ],
    },
  },
  {
    test: (pathname) => pathname.startsWith("/services"),
    context: {
      area: "RINADS Services",
      prompt: "What outcome do you need RINADS to deliver for you?",
      suggestions: [
        "Build custom software",
        "Automate operations",
        "Grow my brand",
        "Plan an AI implementation",
      ],
    },
  },
  {
    test: (pathname) => pathname.startsWith("/projects"),
    context: {
      area: "Project Intake",
      prompt: "Describe what you want to achieve and I can structure the requirement.",
      suggestions: [
        "Run my business better",
        "Build software",
        "Sell online",
        "Automate operations",
      ],
    },
  },
  {
    test: (pathname) => pathname.startsWith("/rinpo"),
    context: {
      area: "RINPO",
      prompt: "Ask me what I can understand, recommend, or help you operate.",
      suggestions: [
        "What can RINPO do?",
        "How does RINPO use business context?",
        "How do approvals work?",
        "Show me RINPO channels",
      ],
    },
  },
];

function enrichSolutionContext(pathname: string, base: RinpoPageContext): RinpoPageContext {
  const match = /^\/solutions\/([^/]+)/.exec(pathname);
  if (!match) return base;
  const slug = match[1];
  const industry = SOLUTION_INDUSTRY_BY_SLUG[slug] ?? null;
  const solution = getSolution(slug);
  const productHints = solution?.poweredBy;
  const industryLabel = solution?.industry ?? slug;
  return {
    ...base,
    industry,
    productHints,
    area: solution ? `${solution.editionName}` : base.area,
    prompt: industry
      ? `Tell me how ${industryLabel} operations map to RINADS — I'll use ${solution?.editionName ?? "this edition"} context.`
      : base.prompt,
    suggestions: industry
      ? [
          `Map RINADS to my ${industryLabel} workflow`,
          "What modules are live vs roadmap?",
          "Show a sample day with RINPO",
          "Explain custom configuration",
        ]
      : base.suggestions,
  };
}

export function getRinpoPageContext(pathname: string | null | undefined): RinpoPageContext {
  const value = pathname ?? "/";
  const base = CONTEXT_RULES.find((rule) => rule.test(value))?.context ?? DEFAULT_CONTEXT;
  if (value.startsWith("/solutions")) {
    return enrichSolutionContext(value, base);
  }
  return base;
}
