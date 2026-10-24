import type { ServiceLine } from "./types";

export type ServiceImplementationGroupId =
  | "software-implementation"
  | "system-integration"
  | "ai-automation"
  | "migration"
  | "business-transformation"
  | "growth-systems"
  | "creative-systems"
  | "training";

export type ServiceImplementationGroup = {
  id: ServiceImplementationGroupId;
  title: string;
  summary: string;
  /** Existing service line slugs mapped into this group */
  serviceSlugs: string[];
};

export const SERVICE_IMPLEMENTATION_TITLE = "RINADS Implementation Services";

export const SERVICE_IMPLEMENTATION_GROUPS: ServiceImplementationGroup[] = [
  {
    id: "software-implementation",
    title: "Software Implementation",
    summary: "Web, mobile, commerce, and business systems delivered on the RINADS platform.",
    serviceSlugs: ["software"],
  },
  {
    id: "system-integration",
    title: "System Integration",
    summary: "Connect POS, payments, messaging, and legacy systems with governed data flow.",
    serviceSlugs: ["automation"],
  },
  {
    id: "ai-automation",
    title: "AI & Automation",
    summary: "RINPO-assisted workflows, agents, and automation with permissions and approvals through RINPO Runtime.",
    serviceSlugs: ["ai", "automation"],
  },
  {
    id: "migration",
    title: "Migration",
    summary: "Move from scattered tools to a connected operating model without losing operational truth.",
    serviceSlugs: ["transformation"],
  },
  {
    id: "business-transformation",
    title: "Business Transformation",
    summary: "Operating model redesign, Industry RINASPACE configuration, and change programs on RINADS.",
    serviceSlugs: ["transformation"],
  },
  {
    id: "growth-systems",
    title: "Growth Systems",
    summary: "SEO, paid media, CRM programs, and follow-up connected to shared business and growth capabilities.",
    serviceSlugs: ["marketing"],
  },
  {
    id: "creative-systems",
    title: "Creative Systems",
    summary: "Brand, AI media, and campaign production pipelines connected to RINADS workflows.",
    serviceSlugs: ["creative"],
  },
  {
    id: "training",
    title: "Training",
    summary: "RI LABS programs, practical experience, and team enablement with RINPO tutoring.",
    serviceSlugs: ["training"],
  },
];

export const SERVICE_LINES: ServiceLine[] = [
  {
    slug: "software",
    name: "Software",
    verb: "Build",
    headline: "Build software with RINADS.",
    summary:
      "Web apps, mobile apps, commerce, and business systems — designed and delivered through RINADS Implementation Services.",
    offerings: ["Web & mobile apps", "Business systems", "Commerce platforms", "Integrations", "Ongoing product teams"],
  },
  {
    slug: "marketing",
    name: "Marketing",
    verb: "Grow",
    headline: "Grow your brand with intelligence.",
    summary:
      "SEO, paid media, social, WhatsApp, and CRM programs connected to RINADS growth and customer workflows.",
    offerings: ["SEO", "Performance ads", "Social growth", "WhatsApp & email", "Analytics"],
  },
  {
    slug: "ai",
    name: "Intelligence & AI",
    verb: "Intelligence",
    headline: "Apply intelligence where it creates business value.",
    summary:
      "Assistants, agents, and intelligence built around RINPO, business context, permissions, approvals, and measurable outcomes.",
    offerings: ["AI assistants", "Agent workflows", "Knowledge systems", "Voice & phone agents", "Tool integrations"],
  },
  {
    slug: "creative",
    name: "Creative",
    verb: "Create",
    headline: "Create brand and media with RINADS.",
    summary: "AI image, video, film, brand systems, and story production — from brief to shipped assets and connected campaigns.",
    offerings: ["Brand systems", "AI image & video", "AI film", "Product studio", "Campaign creative"],
  },
  {
    slug: "automation",
    name: "Automation",
    verb: "Automate",
    headline: "Automate operations end to end.",
    summary: "Workflow design, integrations, and governed automation that reduce manual load across connected business capabilities.",
    offerings: ["Workflow design", "Integrations", "Notifications", "Approvals", "Audit trails"],
  },
  {
    slug: "transformation",
    name: "Transformation",
    verb: "Transform",
    headline: "Transform how the business runs.",
    summary:
      "Operating model redesign on RINADS — migrate from scattered tools to one intelligent platform.",
    offerings: ["Operating model", "Migration", "Industry configuration", "Change programs", "Enablement"],
  },
  {
    slug: "training",
    name: "Training",
    verb: "Train",
    headline: "Learn, practice, and build through RI LABS.",
    summary:
      "Founder, team, and learner programs — learn, practice, ship, and build evidence with RINPO tutoring and real project work.",
    offerings: ["Team programs", "Founder programs", "Live classes", "Project evidence", "On-the-job projects"],
  },
];

export function getServiceLine(slug: string): ServiceLine | null {
  return SERVICE_LINES.find((s) => s.slug === slug) ?? null;
}

export const RINPO_ROLES = [
  { name: "Business Intelligence Character", description: "The face of RINADS Intelligence." },
  { name: "AI assistant", description: "Ask, explore, and get direction." },
  { name: "AI tutor", description: "Guide learning and practical work inside RI LABS." },
  { name: "AI operator", description: "Help run supported day-to-day work within permissions." },
  { name: "Voice interface", description: "Use speech as an input and output channel where the client supports it." },
  { name: "Phone experience", description: "Product direction for connecting telephony to RINADS context and workflows." },
  { name: "AI commerce assistant", description: "Support selling and buying flows." },
  { name: "AI business interface", description: "The persistent front door to the platform." },
] as const;

export const RINPO_CHANNELS = ["Web", "Mobile", "Chat", "Voice", "WhatsApp", "Phone", "3D"] as const;

/**
 * Outcome-level only. RINADS Intelligence's internal architecture (graphs,
 * gateway, decision/recommendation engines, agent runtime, tool routing) is
 * a founder/staff concept, not public marketing content — see docs/ for the
 * internal reference.
 */
export const INTELLIGENCE_CAPABILITIES = [
  { name: "Understands your business", description: "Connects customers, work, money, and activity in one place." },
  { name: "Remembers what matters", description: "Keeps context for people, orders, and ongoing work." },
  { name: "Recommends the next best action", description: "Turns signals into clear, useful suggestions." },
  { name: "Connects insight to action", description: "Moves from understanding to workflow within configured controls." },
  { name: "Respects who can see and do what", description: "Every action honors your organization's permissions." },
  { name: "Keeps a full audit trail", description: "Every AI-assisted action is traceable." },
] as const;

export const CLOUD_CAPABILITIES = [
  { name: "Data", description: "Unified business data layer." },
  { name: "AI", description: "Model and inference infrastructure." },
  { name: "APIs", description: "Programmable platform surface." },
  { name: "Integrations", description: "Connect external systems." },
  { name: "Events", description: "Real-time event fabric." },
  { name: "Storage", description: "Files, media, and structured storage." },
  { name: "Security", description: "Identity, access, and protection." },
  { name: "Automation", description: "Cloud-side workflow execution." },
  { name: "Infrastructure", description: "Reliable platform foundation." },
] as const;
