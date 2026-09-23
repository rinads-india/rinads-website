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

export type RinpoPageContext = {
  area: string;
  prompt: string;
  suggestions: readonly string[];
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
};

const CONTEXT_RULES: Array<{ test: (pathname: string) => boolean; context: RinpoPageContext }> = [
  {
    test: (pathname) => pathname === "/" || pathname === "",
    context: DEFAULT_CONTEXT,
  },
  {
    test: (pathname) => pathname.startsWith("/platform/business-os"),
    context: {
      area: "Business OS",
      prompt: "Want me to show what needs attention in a business?",
      suggestions: [
        "What needs attention today?",
        "Show leads that need follow-up",
        "Review overdue work",
        "Explain Business OS",
      ],
    },
  },
  {
    test: (pathname) => pathname.startsWith("/platform/commerce-os"),
    context: {
      area: "Commerce OS",
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
    test: (pathname) => pathname.startsWith("/platform/marketing-os"),
    context: {
      area: "Marketing OS",
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
    test: (pathname) => pathname.startsWith("/platform/logistics-os"),
    context: {
      area: "Logistics OS",
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
      area: "Creative OS",
      prompt: "What would you like to create?",
      suggestions: [
        "Build an AI content workflow",
        "Plan an AI film",
        "Create a product-content pipeline",
        "Explain Creative OS",
      ],
    },
  },
  {
    test: (pathname) => pathname.startsWith("/platform/build-os"),
    context: {
      area: "Build OS",
      prompt: "What software or system do you want to build?",
      suggestions: [
        "Turn an idea into a PRD",
        "Review an architecture",
        "Plan a software build",
        "Explain Build OS",
      ],
    },
  },
  {
    test: (pathname) => pathname.startsWith("/platform/academy-os") || pathname.startsWith("/academy"),
    context: {
      area: "Academy",
      prompt: "What would you like to learn or train your team on?",
      suggestions: [
        "Help me choose a program",
        "Explain the learning path",
        "Train my team on AI",
        "Show how RINPO tutors",
      ],
    },
  },
  {
    test: (pathname) => pathname.startsWith("/platform/automation-os"),
    context: {
      area: "Automation OS",
      prompt: "What repetitive work do you want to automate?",
      suggestions: [
        "Map an approval workflow",
        "Automate lead follow-up",
        "Connect two business systems",
        "Explain Automation OS",
      ],
    },
  },
  {
    test: (pathname) => pathname.startsWith("/platform/rinads-intelligence"),
    context: {
      area: "RINADS Intelligence",
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
    test: (pathname) => pathname.startsWith("/platform/rinads-cloud"),
    context: {
      area: "RINADS Cloud",
      prompt: "What part of the platform foundation do you want to understand?",
      suggestions: [
        "Explain tenant isolation",
        "Show the API layer",
        "How does the AI gateway fit?",
        "Explain events and audit",
      ],
    },
  },
  {
    test: (pathname) => pathname.startsWith("/solutions"),
    context: {
      area: "Industry Solutions",
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

export function getRinpoPageContext(pathname: string | null | undefined): RinpoPageContext {
  const value = pathname ?? "/";
  return CONTEXT_RULES.find((rule) => rule.test(value))?.context ?? DEFAULT_CONTEXT;
}
