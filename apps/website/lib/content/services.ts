import type { ServiceLine } from "./types";

export const SERVICE_LINES: ServiceLine[] = [
  {
    slug: "software",
    name: "Software",
    verb: "Build",
    headline: "Build software with RINADS.",
    summary:
      "Web apps, mobile apps, commerce, and business systems — delivered through Build OS discipline and RINADS Services.",
    offerings: ["Web & mobile apps", "Business systems", "Commerce platforms", "Integrations", "Ongoing product teams"],
  },
  {
    slug: "marketing",
    name: "Marketing",
    verb: "Grow",
    headline: "Grow your brand with intelligence.",
    summary:
      "SEO, paid media, social, WhatsApp, and CRM programs — launched as services and managed inside Marketing OS.",
    offerings: ["SEO", "Performance ads", "Social growth", "WhatsApp & email", "Analytics"],
  },
  {
    slug: "ai",
    name: "AI",
    verb: "Automate",
    headline: "AI systems that operate your business.",
    summary:
      "Assistants, agents, and intelligence built on RINPO — with human approval on every meaningful action.",
    offerings: ["AI assistants", "Agent workflows", "Knowledge systems", "Voice & phone agents", "Tool integrations"],
  },
  {
    slug: "creative",
    name: "Creative",
    verb: "Create",
    headline: "Create brand and media with Creative OS.",
    summary: "AI image, video, film, brand systems, and story production — from brief to shipped assets.",
    offerings: ["Brand systems", "AI image & video", "AI film", "Product studio", "Campaign creative"],
  },
  {
    slug: "automation",
    name: "Automation",
    verb: "Automate",
    headline: "Automate operations end to end.",
    summary: "Workflow design, integrations, and agentic automation that reduce manual load across the OS suite.",
    offerings: ["Workflow design", "Integrations", "Notifications", "Approvals", "Audit trails"],
  },
  {
    slug: "transformation",
    name: "Transformation",
    verb: "Transform",
    headline: "Transform how the business runs.",
    summary:
      "Operating model redesign on RINADS — migrate from scattered tools to one intelligent platform.",
    offerings: ["Operating model", "Migration", "Vertical configuration", "Change programs", "Enablement"],
  },
  {
    slug: "training",
    name: "Training",
    verb: "Train",
    headline: "Train teams through Real Experience Academy.",
    summary:
      "Corporate and founder training programs — learn, practice, ship, and certify with RINPO tutoring.",
    offerings: ["Team academies", "Founder programs", "Live classes", "Certification", "On-the-job projects"],
  },
];

export function getServiceLine(slug: string): ServiceLine | null {
  return SERVICE_LINES.find((s) => s.slug === slug) ?? null;
}

export const RINPO_ROLES = [
  { name: "AI Business Intelligence Character", description: "The face of RINADS intelligence." },
  { name: "AI assistant", description: "Ask, explore, and get direction." },
  { name: "AI tutor", description: "Guide learning inside Academy." },
  { name: "AI operator", description: "Help run day-to-day work." },
  { name: "AI voice agent", description: "Speak with your business interface." },
  { name: "AI phone agent", description: "Handle calls and follow-ups." },
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
  { name: "Connects insight to action", description: "Moves from understanding to workflow, automatically." },
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
