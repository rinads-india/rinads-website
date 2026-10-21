import { can } from "./permissions";

/**
 * The single registry of Company OS areas. One shell, role-aware visibility.
 * Nothing here grants access — routes re-check on the server and RLS enforces at the database.
 */
export type OsAreaId =
  | "home"
  | "founder"
  | "customers"
  | "sales"
  | "work"
  | "studio"
  | "growth"
  | "ads"
  | "engineering"
  | "ai"
  | "commerce"
  | "finance"
  | "people"
  | "logistics"
  | "communication"
  | "academy"
  | "platforms"
  | "assets"
  | "approvals"
  | "reports"
  | "settings";

export type OsAreaGroup = "company" | "revenue" | "delivery" | "create" | "operate" | "build" | "admin";

export const OS_AREA_GROUP_LABEL: Record<OsAreaGroup, string> = {
  company: "Company",
  revenue: "Revenue",
  delivery: "Delivery",
  create: "Create & grow",
  operate: "Operate",
  build: "Build & AI",
  admin: "Admin",
};

export type OsArea = {
  id: OsAreaId;
  label: string;
  href: string;
  group: OsAreaGroup;
  summary: string;
  /** Permission needed to see this area. "member" = any active org member. */
  requires: string | "member";
};

export const OS_AREAS: readonly OsArea[] = [
  { id: "home", label: "Home", href: "/os", group: "company", summary: "Today, attention and your daily brief", requires: "member" },
  { id: "founder", label: "Founder", href: "/os/founder", group: "company", summary: "Company pulse, risks, decisions and daily close", requires: "founder.read" },
  { id: "approvals", label: "Approvals", href: "/os/approvals", group: "company", summary: "Decisions waiting on a human", requires: "approvals.read" },
  { id: "customers", label: "Customers", href: "/os/customers", group: "revenue", summary: "Companies, contacts and client workspaces", requires: "member" },
  { id: "sales", label: "Sales", href: "/os/sales", group: "revenue", summary: "Leads, pipeline, proposals and contracts", requires: "sales.read" },
  { id: "finance", label: "Finance", href: "/os/finance", group: "revenue", summary: "Invoices, receivables and cash", requires: "finance.read" },
  { id: "work", label: "Work", href: "/os/work", group: "delivery", summary: "Projects, tasks and allocation", requires: "member" },
  { id: "people", label: "People", href: "/os/people", group: "delivery", summary: "Skills and capacity", requires: "people.read" },
  { id: "studio", label: "Studio", href: "/os/studio", group: "create", summary: "Creative production pipeline", requires: "studio.read" },
  { id: "assets", label: "Assets", href: "/os/assets", group: "create", summary: "Creative library with provenance", requires: "studio.read" },
  { id: "growth", label: "Growth", href: "/os/growth", group: "create", summary: "Campaigns and multi-channel content", requires: "member" },
  { id: "ads", label: "Ads", href: "/os/ads", group: "create", summary: "Paid performance signals", requires: "growth.read" },
  { id: "commerce", label: "Commerce", href: "/os/commerce", group: "operate", summary: "Orders and storefront operations", requires: "commerce.order.read" },
  { id: "logistics", label: "Logistics", href: "/os/logistics", group: "operate", summary: "Shipments, exceptions and returns", requires: "commerce.order.read" },
  { id: "communication", label: "Communication", href: "/os/communication", group: "operate", summary: "Calls, messages and email linked to work", requires: "comms.read" },
  { id: "academy", label: "Academy", href: "/os/academy", group: "operate", summary: "Skills, practice and certification", requires: "academy.read" },
  { id: "engineering", label: "Engineering", href: "/os/engineering", group: "build", summary: "GitHub, Vercel and Supabase health", requires: "engineering.read" },
  { id: "ai", label: "AI", href: "/os/ai", group: "build", summary: "Providers, runs, cost and roles", requires: "ai.read" },
  { id: "platforms", label: "Platforms", href: "/os/platforms", group: "build", summary: "Verticals and templates", requires: "org.read" },
  { id: "reports", label: "Reports", href: "/os/reports", group: "admin", summary: "Computed company reports", requires: "reports.read" },
  { id: "settings", label: "Settings", href: "/os/settings", group: "admin", summary: "Organisation, policies and integrations", requires: "org.manage" },
];

export type VisibleMember = { roleKey: string | null; permissions: readonly string[] };

export function isAreaVisible(area: OsArea, member: VisibleMember | null): boolean {
  if (area.requires === "member") return true;
  if (!member) return false;
  return can(member, area.requires);
}

export function visibleAreas(member: VisibleMember | null): OsArea[] {
  return OS_AREAS.filter((area) => isAreaVisible(area, member));
}

export function groupAreas(areas: readonly OsArea[]): { group: OsAreaGroup; label: string; areas: OsArea[] }[] {
  const order: OsAreaGroup[] = ["company", "revenue", "delivery", "create", "operate", "build", "admin"];
  return order
    .map((group) => ({
      group,
      label: OS_AREA_GROUP_LABEL[group],
      areas: areas.filter((area) => area.group === group),
    }))
    .filter((entry) => entry.areas.length > 0);
}

export function getArea(id: OsAreaId): OsArea {
  const area = OS_AREAS.find((a) => a.id === id);
  if (!area) throw new Error(`Unknown Company OS area: ${id}`);
  return area;
}

/** Resolve the area for a pathname. Longest-prefix match; `/os` only matches exactly. */
export function resolveAreaFromPath(pathname: string): OsAreaId | null {
  const path = pathname.split("?")[0]?.replace(/\/$/, "") || "/";
  if (path === "/os" || path === "/os/home") return "home";
  const legacy: Record<string, OsAreaId> = {
    "/os/money": "finance",
    "/os/automate": "settings",
    "/os/rooms": "communication",
  };
  for (const [prefix, id] of Object.entries(legacy)) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return id;
  }
  let best: OsArea | null = null;
  for (const area of OS_AREAS) {
    if (area.href === "/os") continue;
    if (path === area.href || path.startsWith(`${area.href}/`)) {
      if (!best || area.href.length > best.href.length) best = area;
    }
  }
  return best?.id ?? null;
}
