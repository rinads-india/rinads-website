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
      "Assistants, agents, and intelligence layers wired into RINPO Runtime and RINADS Intelligence — with human approval.",
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

export const INTELLIGENCE_CAPABILITIES = [
  { name: "Business Graph", description: "Entities and relationships across the business." },
  { name: "Event Graph", description: "What happened, when, and why it matters." },
  { name: "AI Gateway", description: "Controlled access to models and tools." },
  { name: "Memory", description: "Persistent context for people, orgs, and work." },
  { name: "Analytics", description: "Measure performance across the OS suite." },
  { name: "Decision Engine", description: "Turn signals into clear decisions." },
  { name: "Recommendation Engine", description: "Suggest the next best action." },
  { name: "Automation", description: "Connect insight to workflow." },
  { name: "Workflow", description: "Multi-step business processes." },
  { name: "Permissions", description: "Who can see and do what." },
  { name: "Audit", description: "Traceable intelligence and action." },
  { name: "Agent Runtime", description: "Execute agentic work safely." },
  { name: "Tool Router", description: "Route requests to the right capability." },
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
