import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  Bot,
  Briefcase,
  CheckSquare,
  Clapperboard,
  Code2,
  Crown,
  GraduationCap,
  Home,
  Images,
  Layers,
  Megaphone,
  MessageSquare,
  MoreHorizontal,
  Settings,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";
import {
  groupAreas,
  resolveAreaFromPath,
  visibleAreas,
  type OsAreaGroup,
  type OsAreaId,
  type VisibleMember,
} from "@rinads/company-os";
import type { OsCapabilityTier } from "@/lib/os-org-role";
import { tierAtLeast } from "@/lib/os-org-role";

export type OsPrimaryNavId =
  | "home"
  | "customers"
  | "work"
  | "money"
  | "growth"
  | "automate"
  | "rooms"
  | OsAreaId;

export type OsUtilityNavId = "settings" | "more" | "integrations";

export type OsNavId = OsPrimaryNavId | OsUtilityNavId;

export type OsNavItem = {
  id: OsNavId;
  label: string;
  icon: LucideIcon;
  href: string;
  /** Minimum capability to show this nav item. Omit = always for authenticated OS users. */
  minTier?: OsCapabilityTier;
};

function visibleForTier(item: OsNavItem, tier: OsCapabilityTier | null): boolean {
  if (!item.minTier) return true;
  if (!tier) return false;
  return tierAtLeast(tier, item.minTier);
}

/** Desktop primary + secondary (Rooms). */
export function getOsDesktopNavItems(tier: OsCapabilityTier | null = null): OsNavItem[] {
  const items: OsNavItem[] = [
    { id: "home", label: "Home", icon: Home, href: "/os" },
    { id: "customers", label: "Customers", icon: Users, href: "/os/customers" },
    { id: "work", label: "Work", icon: Briefcase, href: "/os/work" },
    { id: "money", label: "Money", icon: Wallet, href: "/os/money", minTier: "staff" },
    { id: "growth", label: "Growth", icon: Sparkles, href: "/os/growth" },
    { id: "automate", label: "Automate", icon: Workflow, href: "/os/automate" },
    { id: "rooms", label: "Rooms", icon: Layers, href: "/os/rooms" },
  ];
  return items.filter((item) => visibleForTier(item, tier));
}

/** Mobile bottom bar — Home, Customers, Work, Growth, More. */
export function getOsMobilePrimaryNavItems(_tier: OsCapabilityTier | null = null): OsNavItem[] {
  void _tier;
  return [
    { id: "home", label: "Home", icon: Home, href: "/os" },
    { id: "customers", label: "Customers", icon: Users, href: "/os/customers" },
    { id: "work", label: "Work", icon: Briefcase, href: "/os/work" },
    { id: "growth", label: "Growth", icon: Sparkles, href: "/os/growth" },
    { id: "more", label: "More", icon: MoreHorizontal, href: "#more" },
  ];
}

/** Items inside mobile More sheet. */
export function getOsMobileMoreNavItems(tier: OsCapabilityTier | null = null): OsNavItem[] {
  const items: OsNavItem[] = [
    { id: "money", label: "Money", icon: Wallet, href: "/os/money", minTier: "staff" },
    { id: "automate", label: "Automate", icon: Workflow, href: "/os/automate" },
    { id: "rooms", label: "Rooms", icon: Layers, href: "/os/rooms" },
    { id: "integrations", label: "Integrations", icon: Workflow, href: "/os/automate#integrations" },
    { id: "settings", label: "Settings", icon: Settings, href: "/os/settings", minTier: "admin" },
  ];
  return items.filter((item) => visibleForTier(item, tier));
}

export function getOsSidebarUtilityItems(tier: OsCapabilityTier | null = null): OsNavItem[] {
  const items: OsNavItem[] = [
    { id: "settings", label: "Settings", icon: Settings, href: "/os/settings", minTier: "admin" },
  ];
  return items.filter((item) => visibleForTier(item, tier));
}

/**
 * Resolve which nav item is active for a pathname.
 * Home matches only exact `/os` (and optional query). Work matches nested work routes.
 */
export function resolveOsActiveNavId(pathname: string): OsPrimaryNavId | OsUtilityNavId | null {
  const path = pathname.split("?")[0]?.replace(/\/$/, "") || "/";

  if (path === "/os" || path === "/os/home") return "home";
  if (path.startsWith("/os/customers")) return "customers";
  if (path.startsWith("/os/work")) return "work";
  if (path.startsWith("/os/money")) return "money";
  if (path.startsWith("/os/growth")) return "growth";
  if (path.startsWith("/os/automate")) return "automate";
  if (path.startsWith("/os/rooms")) return "rooms";
  if (path.startsWith("/os/settings")) return "settings";
  // Company OS areas (founder, sales, finance, studio, …) resolve through the shared registry.
  const area = resolveAreaFromPath(path);
  return area && area !== "settings" ? area : null;
}

/** True if any nav label is the forbidden duplicate "Dashboard". */
export function osNavContainsDashboardLabel(items: OsNavItem[]): boolean {
  return items.some((item) => item.label.toLowerCase() === "dashboard");
}

// ── Company OS: one shell, 21 role-aware areas ───────────────────────────────

const AREA_ICON: Record<OsAreaId, LucideIcon> = {
  home: Home,
  founder: Crown,
  approvals: CheckSquare,
  customers: Users,
  sales: TrendingUp,
  finance: Wallet,
  work: Briefcase,
  people: UserCog,
  studio: Clapperboard,
  assets: Images,
  growth: Sparkles,
  ads: Megaphone,
  commerce: ShoppingBag,
  logistics: Truck,
  communication: MessageSquare,
  academy: GraduationCap,
  engineering: Code2,
  ai: Bot,
  platforms: Boxes,
  reports: BarChart3,
  settings: Settings,
};

export type OsAreaNavGroup = { group: OsAreaGroup; label: string; items: OsNavItem[] };

/**
 * Grouped navigation for the signed-in member. Visibility is a UI convenience: every route
 * re-checks on the server and RLS decides what data is returned.
 */
export function getOsAreaNavGroups(member: VisibleMember | null): OsAreaNavGroup[] {
  return groupAreas(visibleAreas(member)).map((g) => ({
    group: g.group,
    label: g.label,
    items: g.areas.map<OsNavItem>((a) => ({ id: a.id, label: a.label, icon: AREA_ICON[a.id], href: a.href })),
  }));
}

const MOBILE_PRIMARY_AREAS: ReadonlySet<string> = new Set(["home", "customers", "work", "growth"]);

/** Everything the member can see that is not already on the mobile bottom bar. */
export function getOsMobileMoreAreaItems(member: VisibleMember | null): OsNavItem[] {
  return getOsAreaNavGroups(member)
    .flatMap((g) => g.items)
    .filter((item) => !MOBILE_PRIMARY_AREAS.has(item.id));
}

export { resolveAreaFromPath as resolveOsActiveAreaId };
