export type ServiceExperienceKey =
  | "software"
  | "marketing"
  | "ai"
  | "automation"
  | "creative"
  | "transformation"
  | "training";

export type ServiceExperienceConfig = {
  slug: ServiceExperienceKey;
  publicVerb: string;
  publicName: string;
  outcome: string;
  platform: readonly string[];
  process: readonly string[];
  rinpoPrompt: string;
};

export const SERVICE_EXPERIENCES: Record<ServiceExperienceKey, ServiceExperienceConfig> = {
  software: {
    slug: "software",
    publicVerb: "BUILD",
    publicName: "Software & Systems",
    outcome: "Move from business requirement to a maintainable software product with architecture, implementation, test, deployment, and handover.",
    platform: ["Build OS", "Business OS", "RINADS Cloud"],
    process: ["Discover", "Define", "Design", "Build", "Test", "Deploy", "Improve"],
    rinpoPrompt: "Help me structure a software or business-system project with RINADS.",
  },
  marketing: {
    slug: "marketing",
    publicVerb: "GROW",
    publicName: "Marketing & Growth",
    outcome: "Connect strategy, campaigns, content, lead flow, CRM follow-up, and measurement instead of buying isolated marketing activity.",
    platform: ["Marketing OS", "Creative OS", "Business OS"],
    process: ["Diagnose", "Plan", "Create", "Launch", "Capture", "Follow up", "Measure"],
    rinpoPrompt: "Help me structure a growth and marketing engagement with RINADS.",
  },
  ai: {
    slug: "ai",
    publicVerb: "INTELLIGENCE",
    publicName: "Intelligence & AI",
    outcome: "Design useful AI interfaces, assistants, and tool-connected workflows around business context, permissions, approvals, and measurable outcomes.",
    platform: ["RINPO", "RINADS Intelligence", "Automation OS"],
    process: ["Identify", "Contextualize", "Prototype", "Guard", "Integrate", "Evaluate", "Improve"],
    rinpoPrompt: "Help me identify where Intelligence and AI can create measurable value in my business.",
  },
  automation: {
    slug: "automation",
    publicVerb: "AUTOMATE",
    publicName: "Automation",
    outcome: "Reduce repetitive operational work by connecting triggers, conditions, approvals, actions, notifications, and audit paths.",
    platform: ["Automation OS", "Business OS", "RINADS Cloud"],
    process: ["Map", "Prioritize", "Design", "Approve", "Automate", "Observe", "Improve"],
    rinpoPrompt: "Help me identify and prioritize business workflows to automate.",
  },
  creative: {
    slug: "creative",
    publicVerb: "CREATE",
    publicName: "Creative & Media",
    outcome: "Turn a brief into consistent brand, image, video, film, and campaign assets through a controlled production workflow.",
    platform: ["Creative OS", "Marketing OS", "RINPO"],
    process: ["Brief", "Concept", "Script", "Produce", "Review", "Adapt", "Ship"],
    rinpoPrompt: "Help me structure a creative or AI production project with RINADS.",
  },
  transformation: {
    slug: "transformation",
    publicVerb: "TRANSFORM",
    publicName: "Business Transformation",
    outcome: "Redesign operating processes, migrate fragmented tools, and configure RINADS around how the business should run.",
    platform: ["Business OS", "Automation OS", "RINADS Cloud"],
    process: ["Audit", "Map", "Prioritize", "Redesign", "Migrate", "Enable", "Measure"],
    rinpoPrompt: "Help me map a business transformation from scattered tools into RINADS.",
  },
  training: {
    slug: "training",
    publicVerb: "TRAIN",
    publicName: "Training & Enablement",
    outcome: "Build practical capability through guided learning, real work, shipped projects, team enablement, and measurable skill progression.",
    platform: ["Academy OS", "RINPO", "RINADS Academy"],
    process: ["Assess", "Learn", "Practice", "Work", "Ship", "Measure", "Improve"],
    rinpoPrompt: "Help me design a training and enablement path for my team.",
  },
};

export function getServiceExperience(slug: string): ServiceExperienceConfig | null {
  if (slug in SERVICE_EXPERIENCES) {
    return SERVICE_EXPERIENCES[slug as ServiceExperienceKey];
  }
  return null;
}
