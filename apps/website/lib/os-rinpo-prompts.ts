export type OsRinpoModule =
  | "home"
  | "dashboard"
  | "customers"
  | "work"
  | "money"
  | "growth"
  | "automate"
  | "rooms"
  | "leads"
  | "projects"
  | "finance"
  | "marketing"
  | "analytics"
  | "tasks";

export const OS_RINPO_PROMPTS: Record<OsRinpoModule, string> = {
  home: "What should I focus on today?",
  dashboard: "What should I focus on today?",
  customers: "Which leads have not been followed up?",
  work: "Which projects are at risk?",
  money: "Which invoices are overdue?",
  growth: "Which campaign needs attention?",
  automate: "Which workflows need attention?",
  rooms: "Summarise this room.",
  leads: "Which leads should I follow up with today?",
  projects: "Which projects are at risk?",
  finance: "What invoices are overdue?",
  marketing: "Which campaign needs attention?",
  analytics: "What changed this month?",
  tasks: "Prioritize today's work.",
};

export function getOsRinpoPrompts(module: OsRinpoModule = "home"): string[] {
  const primary = OS_RINPO_PROMPTS[module];
  const preferred: OsRinpoModule[] = ["home", "customers", "work", "money", "growth", "rooms"];
  const others = preferred
    .filter((key) => key !== module && key !== "dashboard")
    .slice(0, 2)
    .map((key) => OS_RINPO_PROMPTS[key]);
  return [primary, ...others];
}

export function resolveOsModuleFromParam(value: string | null): OsRinpoModule {
  const allowed: OsRinpoModule[] = [
    "home",
    "dashboard",
    "customers",
    "work",
    "money",
    "growth",
    "automate",
    "rooms",
    "leads",
    "projects",
    "finance",
    "marketing",
    "analytics",
    "tasks",
  ];
  if (value && allowed.includes(value as OsRinpoModule)) {
    if (value === "dashboard") return "home";
    if (value === "marketing") return "growth";
    if (value === "finance") return "money";
    if (value === "grow") return "growth";
    return value as OsRinpoModule;
  }
  if (value === "grow") return "growth";
  return "home";
}

export function resolveOsModuleFromPathname(pathname: string): OsRinpoModule {
  const path = pathname.split("?")[0] ?? pathname;
  if (path.startsWith("/os/customers")) return "customers";
  if (path.startsWith("/os/work")) return "work";
  if (path.startsWith("/os/money")) return "money";
  if (path.startsWith("/os/growth")) return "growth";
  if (path.startsWith("/os/automate")) return "automate";
  if (path.startsWith("/os/rooms")) return "rooms";
  return "home";
}

export function getGreetingForHour(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
