export type ProjectGoal =
  | "run"
  | "build"
  | "grow"
  | "sell"
  | "automate"
  | "create"
  | "learn"
  | "transform"
  | "other";

export type ProjectIntakeDraft = {
  goal: ProjectGoal | null;
  name: string;
  email: string;
  company: string;
  phone: string;
  industry: string;
  problem: string;
  desiredOutcome: string;
  users: string;
  currentTools: string;
  mustHaves: string;
  budgetRange: string;
  timeline: string;
  selectedNeeds: string[];
};

export type ProjectBrief = {
  title: string;
  goalLabel: string;
  problem: string;
  desiredOutcome: string;
  scope: string[];
  users: string;
  currentTools: string;
  constraints: string[];
  budgetRange: string;
  timeline: string;
  nextStep: string;
};

export const PROJECT_GOALS: Array<{
  id: ProjectGoal;
  label: string;
  description: string;
  needs: string[];
}> = [
  {
    id: "run",
    label: "Run my business better",
    description: "Connect customers, work, money, operations, and visibility.",
    needs: ["Business OS", "CRM", "Projects", "Finance", "Dashboards"],
  },
  {
    id: "build",
    label: "Build software",
    description: "Create a website, app, platform, ERP, portal, or custom system.",
    needs: ["Website", "Web App", "Mobile App", "ERP", "Custom Software"],
  },
  {
    id: "grow",
    label: "Grow my brand",
    description: "Improve positioning, campaigns, content, leads, and follow-up.",
    needs: ["Marketing Strategy", "Performance Ads", "SEO", "Content", "CRM"],
  },
  {
    id: "sell",
    label: "Sell online",
    description: "Build catalogue, storefront, orders, payments, and fulfilment.",
    needs: ["Commerce", "Catalogue", "Payments", "Inventory", "Fulfilment"],
  },
  {
    id: "automate",
    label: "Automate operations",
    description: "Reduce repetitive work with governed workflows and integrations.",
    needs: ["Workflow Automation", "Integrations", "Approvals", "Notifications", "RINPO"],
  },
  {
    id: "create",
    label: "Create media",
    description: "Build brand, campaign, image, video, film, and content systems.",
    needs: ["Brand", "Creative", "AI Images", "Video", "AI Film"],
  },
  {
    id: "learn",
    label: "Train people",
    description: "Build practical capability through Academy and RINPO-assisted learning.",
    needs: ["Academy", "AI Training", "Software", "Marketing", "Team Enablement"],
  },
  {
    id: "transform",
    label: "Transform the business",
    description: "Replace fragmented tools and redesign the operating model.",
    needs: ["Transformation", "Migration", "Automation", "Business OS", "Integrations"],
  },
  {
    id: "other",
    label: "Something else",
    description: "Start from the outcome even if it does not fit a standard category.",
    needs: ["Discovery", "Custom Scope"],
  },
];

export const BUDGET_RANGES = [
  "Not decided yet",
  "Under ₹1 lakh",
  "₹1–3 lakhs",
  "₹3–5 lakhs",
  "₹5–10 lakhs",
  "₹10–25 lakhs",
  "₹25 lakhs+",
] as const;

export const TIMELINES = [
  "Exploring / no fixed date",
  "Within 2 weeks",
  "Within 1 month",
  "1–3 months",
  "3–6 months",
  "6+ months",
] as const;

export function createEmptyProjectIntake(): ProjectIntakeDraft {
  return {
    goal: null,
    name: "",
    email: "",
    company: "",
    phone: "",
    industry: "",
    problem: "",
    desiredOutcome: "",
    users: "",
    currentTools: "",
    mustHaves: "",
    budgetRange: "",
    timeline: "",
    selectedNeeds: [],
  };
}

function goalDefinition(goal: ProjectGoal | null) {
  return PROJECT_GOALS.find((item) => item.id === goal) ?? null;
}

export function getSuggestedNeeds(goal: ProjectGoal | null): string[] {
  return goalDefinition(goal)?.needs ?? [];
}

export function generateProjectBrief(draft: ProjectIntakeDraft): ProjectBrief {
  const goal = goalDefinition(draft.goal);
  const mustHaves = draft.mustHaves
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  const scope = [...new Set([...draft.selectedNeeds, ...mustHaves])].slice(0, 12);

  const constraints: string[] = [];
  if (draft.currentTools.trim()) constraints.push(`Current tools: ${draft.currentTools.trim()}`);
  if (draft.industry.trim()) constraints.push(`Industry context: ${draft.industry.trim()}`);
  if (draft.company.trim()) constraints.push(`Business: ${draft.company.trim()}`);

  return {
    title: goal ? `${goal.label} · Project Brief` : "RINADS Project Brief",
    goalLabel: goal?.label ?? "Custom project",
    problem: draft.problem.trim(),
    desiredOutcome: draft.desiredOutcome.trim(),
    scope: scope.length ? scope : ["Discovery and scope definition"],
    users: draft.users.trim() || "To be clarified",
    currentTools: draft.currentTools.trim() || "To be clarified",
    constraints,
    budgetRange: draft.budgetRange || "Not decided yet",
    timeline: draft.timeline || "Exploring / no fixed date",
    nextStep: "RINADS reviews the submitted brief, validates assumptions, and follows up before any scope, price, schedule, or delivery commitment is made.",
  };
}

export function buildRinpoProjectPrompt(draft: ProjectIntakeDraft): string {
  const brief = generateProjectBrief(draft);
  return [
    "Help me review this RINADS project brief before I submit it.",
    `Goal: ${brief.goalLabel}`,
    `Problem: ${brief.problem || "Not yet defined"}`,
    `Desired outcome: ${brief.desiredOutcome || "Not yet defined"}`,
    `Likely scope: ${brief.scope.join(", ")}`,
    `Users: ${brief.users}`,
    `Current tools: ${brief.currentTools}`,
    `Budget: ${brief.budgetRange}`,
    `Timeline: ${brief.timeline}`,
    "Identify the most important missing requirement or risk. Do not invent a quote, delivery date, or commitment.",
  ].join("\n");
}
