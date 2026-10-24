/**
 * Outcome-based customer journeys for enterprise IA polish.
 * Links only to existing verified routes — no invented capabilities.
 */

export type OutcomeJourney = {
  id: string;
  outcome: string;
  summary: string;
  href: string;
  cta: string;
};

export const OUTCOME_JOURNEYS: OutcomeJourney[] = [
  {
    id: "run-operations",
    outcome: "Run day-to-day operations",
    summary: "Start with Business coverage for customers, work, money, and growth under organisation permissions.",
    href: "/platform/business",
    cta: "Explore RINADS",
  },
  {
    id: "serve-industry",
    outcome: "Configure for your industry",
    summary: "Explore Industry RINASPACES such as RI SALON RINASPACE — configured on the shared RINADS platform.",
    href: "/rinaspace",
    cta: "Activate your RINASPACE",
  },
  {
    id: "govern-ai",
    outcome: "Use AI with approvals",
    summary: "RINPO recommends and prepares actions; sensitive steps stay behind permissions and human approval.",
    href: "/rinpo",
    cta: "Meet RINPO",
  },
  {
    id: "trust-security",
    outcome: "Understand security posture",
    summary: "Review implemented vs planned controls. Certifications are not claimed without verification.",
    href: "/security",
    cta: "Security",
  },
  {
    id: "buy-engage",
    outcome: "Talk about packaging",
    summary: "Pricing describes architecture; public numeric rates appear only after commercial approval.",
    href: "/pricing",
    cta: "Pricing",
  },
  {
    id: "start-conversation",
    outcome: "Start a qualified conversation",
    summary: "Book a demo or describe your project — leads are validated before persistence.",
    href: "/contact?intent=demo",
    cta: "Book a demo",
  },
];
