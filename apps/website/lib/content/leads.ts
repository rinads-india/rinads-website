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
    label: "Automate workflows",
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
    label: "Improve marketing",
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

export type LeadStage = "step1" | "complete";

export type LeadPayload = {
  outcome: string;
  name: string;
  /** Work email — required unless phone provided */
  workEmail: string;
  phone?: string;
  company: string;
  role: string;
  companySize: string;
  industry: string;
  currentTools?: string;
  problem: string;
  timeline: string;
  budget?: string;
  message?: string;
  websiteUrl?: string;
  privacyAccepted: boolean;
  intent?: string;
  plan?: string;
  sourcePath?: string;
  honeypot?: string;
  stage?: LeadStage;
};

export type LeadValidationError = { field: string; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s().-]{7,20}$/;

function rejectSecrets(input: Partial<LeadPayload>, errors: LeadValidationError[]) {
  const blob = `${input.message ?? ""} ${input.problem ?? ""} ${input.currentTools ?? ""}`;
  if (/(password|api[_ -]?key|secret[_ -]?key|private[_ -]?key)/i.test(blob)) {
    errors.push({
      field: "message",
      message: "Do not include passwords, API keys, or other credentials.",
    });
  }
}

/**
 * Step 1: name, email or phone, company, role, primary problem (outcome), privacy.
 * Step 2 / complete: optional enrichment fields; full validation when stage=complete.
 */
export function validateLeadPayload(input: Partial<LeadPayload>): {
  ok: boolean;
  errors: LeadValidationError[];
  value?: LeadPayload;
} {
  const errors: LeadValidationError[] = [];
  const stage: LeadStage = input.stage === "step1" ? "step1" : "complete";

  if (input.honeypot) {
    return { ok: false, errors: [{ field: "honeypot", message: "Rejected." }] };
  }

  if (!input.outcome) {
    errors.push({ field: "outcome", message: "Select your primary problem." });
  }
  if (!input.name?.trim()) errors.push({ field: "name", message: "Enter your name." });

  const email = input.workEmail?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";
  const hasEmail = email.length > 0 && EMAIL_RE.test(email);
  const hasPhone = phone.length > 0 && PHONE_RE.test(phone);

  if (!hasEmail && !hasPhone) {
    errors.push({
      field: "workEmail",
      message: "Enter a valid work email or phone number.",
    });
    if (phone && !hasPhone) {
      errors.push({ field: "phone", message: "Enter a valid phone number." });
    }
  } else if (email && !hasEmail) {
    errors.push({ field: "workEmail", message: "Enter a valid work email." });
  } else if (phone && !hasPhone) {
    errors.push({ field: "phone", message: "Enter a valid phone number." });
  }

  if (!input.company?.trim()) errors.push({ field: "company", message: "Enter your company." });
  if (!input.role?.trim()) errors.push({ field: "role", message: "Enter your role." });

  if (stage === "complete") {
    // Step 2 fields remain optional for conversion; problem text optional if outcome set
    if (!input.privacyAccepted) {
      errors.push({ field: "privacyAccepted", message: "Privacy acknowledgement is required." });
    }
  } else if (!input.privacyAccepted) {
    errors.push({ field: "privacyAccepted", message: "Privacy acknowledgement is required." });
  }

  // Primary problem is the outcome selection; free-text problem optional
  const problem =
    input.problem?.trim() ||
    PROJECT_OUTCOMES.find((o) => o.id === input.outcome)?.label ||
    "";

  rejectSecrets(input, errors);

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    errors: [],
    value: {
      outcome: input.outcome!,
      name: input.name!.trim(),
      workEmail: hasEmail ? email.toLowerCase() : "",
      phone: hasPhone ? phone : undefined,
      company: input.company!.trim(),
      role: input.role!.trim(),
      companySize: input.companySize?.trim() || "",
      industry: input.industry?.trim() || "",
      currentTools: input.currentTools?.trim() || undefined,
      problem,
      timeline: input.timeline?.trim() || "",
      budget: input.budget?.trim() || undefined,
      message: input.message?.trim() || undefined,
      websiteUrl: input.websiteUrl?.trim() || undefined,
      privacyAccepted: true,
      intent: input.intent,
      plan: input.plan,
      sourcePath: input.sourcePath,
      stage,
    },
  };
}

/** Vertical availability — authoritative source is solutionCatalog. */
export {
  VERTICAL_AVAILABILITY,
  getVerticalAvailability,
  type VerticalAvailability,
} from "./solutionCatalog";
