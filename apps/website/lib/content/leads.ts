import type { ProductStatusValue } from "@/lib/product-status";

export type OutcomeOption = {
  id: string;
  label: string;
  description: string;
};

export const PROJECT_OUTCOMES: OutcomeOption[] = [
  {
    id: "run-better",
    label: "Run my business better",
    description: "Customers, work, money, and day-to-day operations on one foundation.",
  },
  {
    id: "replace-tools",
    label: "Replace disconnected tools",
    description: "Consolidate CRM, spreadsheets, commerce, and project tools.",
  },
  {
    id: "automate",
    label: "Automate a workflow",
    description: "Reduce manual handoffs with governed automation.",
  },
  {
    id: "commerce",
    label: "Launch or improve commerce",
    description: "Catalogue, checkout, fulfilment, and customer accounts.",
  },
  {
    id: "build-software",
    label: "Build software",
    description: "Custom systems connected to the RINADS operating layer.",
  },
  {
    id: "implement-ai",
    label: "Implement AI",
    description: "RINPO-assisted workflows with permissions and approvals.",
  },
  {
    id: "marketing",
    label: "Improve marketing/growth",
    description: "Campaigns, content, and lead follow-up connected to CRM.",
  },
  {
    id: "train",
    label: "Train my team",
    description: "Academy programmes and enablement around real work.",
  },
  {
    id: "other",
    label: "Something else",
    description: "Tell us what you need in your own words.",
  },
];

export const COMPANY_SIZES = [
  "1–10",
  "11–50",
  "51–200",
  "201–1000",
  "1000+",
] as const;

export const TIMELINES = [
  "As soon as possible",
  "This quarter",
  "Next 3–6 months",
  "Exploring / no timeline",
] as const;

export type LeadPayload = {
  outcome: string;
  name: string;
  workEmail: string;
  company: string;
  role: string;
  companySize: string;
  industry: string;
  currentTools?: string;
  problem: string;
  timeline: string;
  budget?: string;
  message?: string;
  privacyAccepted: boolean;
  intent?: string;
  plan?: string;
  sourcePath?: string;
  honeypot?: string;
};

export type LeadValidationError = { field: string; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLeadPayload(input: Partial<LeadPayload>): {
  ok: boolean;
  errors: LeadValidationError[];
  value?: LeadPayload;
} {
  const errors: LeadValidationError[] = [];

  if (input.honeypot) {
    return { ok: false, errors: [{ field: "honeypot", message: "Rejected." }] };
  }

  if (!input.outcome) errors.push({ field: "outcome", message: "Select what you are trying to achieve." });
  if (!input.name?.trim()) errors.push({ field: "name", message: "Enter your name." });
  if (!input.workEmail?.trim() || !EMAIL_RE.test(input.workEmail.trim())) {
    errors.push({ field: "workEmail", message: "Enter a valid work email." });
  }
  if (!input.company?.trim()) errors.push({ field: "company", message: "Enter your company." });
  if (!input.role?.trim()) errors.push({ field: "role", message: "Enter your role." });
  if (!input.companySize) errors.push({ field: "companySize", message: "Select company size." });
  if (!input.industry?.trim()) errors.push({ field: "industry", message: "Enter your industry." });
  if (!input.problem?.trim()) errors.push({ field: "problem", message: "Describe the problem." });
  if (!input.timeline) errors.push({ field: "timeline", message: "Select a timeline." });
  if (!input.privacyAccepted) {
    errors.push({ field: "privacyAccepted", message: "Privacy acknowledgement is required." });
  }

  // Never accept secrets
  const blob = `${input.message ?? ""} ${input.problem ?? ""} ${input.currentTools ?? ""}`;
  if (/(password|api[_ -]?key|secret[_ -]?key|private[_ -]?key)/i.test(blob)) {
    errors.push({
      field: "message",
      message: "Do not include passwords, API keys, or other credentials.",
    });
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    errors: [],
    value: {
      outcome: input.outcome!,
      name: input.name!.trim(),
      workEmail: input.workEmail!.trim().toLowerCase(),
      company: input.company!.trim(),
      role: input.role!.trim(),
      companySize: input.companySize!,
      industry: input.industry!.trim(),
      currentTools: input.currentTools?.trim() || undefined,
      problem: input.problem!.trim(),
      timeline: input.timeline!,
      budget: input.budget?.trim() || undefined,
      message: input.message?.trim() || undefined,
      privacyAccepted: true,
      intent: input.intent,
      plan: input.plan,
      sourcePath: input.sourcePath,
    },
  };
}

export type VerticalAvailability = {
  slug: string;
  status: ProductStatusValue;
  tier: "commercial" | "future";
};

/** Align public availability with honest production posture. */
export const VERTICAL_AVAILABILITY: VerticalAvailability[] = [
  { slug: "retail", status: "prototype_demo", tier: "commercial" },
  { slug: "salon", status: "available_configuration", tier: "commercial" },
  { slug: "nursery", status: "prototype_demo", tier: "commercial" },
  { slug: "jewellery", status: "coming_soon", tier: "future" },
  { slug: "healthcare", status: "private_preview", tier: "future" },
  { slug: "logistics", status: "coming_soon", tier: "future" },
];

export function getVerticalAvailability(slug: string): VerticalAvailability {
  return (
    VERTICAL_AVAILABILITY.find((item) => item.slug === slug) ?? {
      slug,
      status: "coming_soon" as const,
      tier: "future" as const,
    }
  );
}
