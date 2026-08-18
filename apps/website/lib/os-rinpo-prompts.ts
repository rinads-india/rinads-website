export type OsRinpoModule =
  | "dashboard"
  | "leads"
  | "projects"
  | "finance"
  | "marketing"
  | "analytics"
  | "tasks";

export const OS_RINPO_PROMPTS: Record<OsRinpoModule, string> = {
  dashboard: "What should I focus on today?",
  leads: "Which leads should I follow up with today?",
  projects: "Which projects are at risk?",
  finance: "What invoices are overdue?",
  marketing: "Which campaign needs attention?",
  analytics: "What changed this month?",
  tasks: "Prioritize today's work.",
};

export function getOsRinpoPrompts(module: OsRinpoModule = "dashboard"): string[] {
  const primary = OS_RINPO_PROMPTS[module];
  const others = (Object.keys(OS_RINPO_PROMPTS) as OsRinpoModule[])
    .filter((key) => key !== module)
    .slice(0, 2)
    .map((key) => OS_RINPO_PROMPTS[key]);
  return [primary, ...others];
}

export function resolveOsModuleFromParam(value: string | null): OsRinpoModule {
  const allowed: OsRinpoModule[] = [
    "dashboard",
    "leads",
    "projects",
    "finance",
    "marketing",
    "analytics",
    "tasks",
  ];
  if (value && allowed.includes(value as OsRinpoModule)) {
    return value as OsRinpoModule;
  }
  return "dashboard";
}

export function getGreetingForHour(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
