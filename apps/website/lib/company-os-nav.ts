import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  Briefcase,
  Building2,
  CheckSquare,
  Clapperboard,
  Cpu,
  Factory,
  GraduationCap,
  Home,
  Landmark,
  Megaphone,
  MoreHorizontal,
  Package,
  Radio,
  Settings,
  Sparkles,
  Target,
  Truck,
  Users,
  Wallet,
  Workflow,
  Wrench,
} from "lucide-react";
import type { OsCapabilityTier } from "@/lib/os-org-role";
import { tierAtLeast } from "@/lib/os-org-role";

export type CompanyOsNavId =
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
  | "settings"
  | "more";

export type CompanyOsNavItem = {
  id: CompanyOsNavId;
  label: string;
  icon: LucideIcon;
  href: string;
  minTier?: OsCapabilityTier;
  /** Primary rail vs More sheet */
  primary?: boolean;
};

function visible(item: CompanyOsNavItem, tier: OsCapabilityTier | null): boolean {
  if (!item.minTier) return true;
  if (!tier) return false;
  return tierAtLeast(tier, item.minTier);
}

const ALL: CompanyOsNavItem[] = [
  { id: "home", label: "Home", icon: Home, href: "/os", primary: true },
  { id: "founder", label: "Founder", icon: Landmark, href: "/os/founder", primary: true, minTier: "admin" },
  { id: "customers", label: "Customers", icon: Building2, href: "/os/customers", primary: true },
  { id: "sales", label: "Sales", icon: Target, href: "/os/sales", primary: true },
  { id: "work", label: "Work", icon: Briefcase, href: "/os/work", primary: true },
  { id: "approvals", label: "Approvals", icon: CheckSquare, href: "/os/approvals", primary: true, minTier: "staff" },
  { id: "finance", label: "Finance", icon: Wallet, href: "/os/finance", minTier: "staff" },
  { id: "people", label: "People", icon: Users, href: "/os/people", minTier: "staff" },
  { id: "studio", label: "Studio", icon: Clapperboard, href: "/os/studio" },
  { id: "growth", label: "Growth", icon: Sparkles, href: "/os/growth" },
  { id: "ads", label: "Ads", icon: Megaphone, href: "/os/ads" },
  { id: "engineering", label: "Engineering", icon: Wrench, href: "/os/engineering" },
  { id: "ai", label: "AI", icon: Cpu, href: "/os/ai" },
  { id: "commerce", label: "Commerce", icon: Package, href: "/os/commerce" },
  { id: "logistics", label: "Logistics", icon: Truck, href: "/os/logistics" },
  { id: "communication", label: "Communication", icon: Radio, href: "/os/communication" },
  { id: "academy", label: "Academy", icon: GraduationCap, href: "/os/academy" },
  { id: "platforms", label: "Platforms", icon: Factory, href: "/os/platforms" },
  { id: "assets", label: "Assets", icon: Boxes, href: "/os/assets" },
  { id: "reports", label: "Reports", icon: BarChart3, href: "/os/reports", minTier: "staff" },
  { id: "settings", label: "Settings", icon: Settings, href: "/os/settings", minTier: "admin" },
];

export function getCompanyOsDesktopNavItems(tier: OsCapabilityTier | null = null): CompanyOsNavItem[] {
  return ALL.filter((i) => i.primary).filter((i) => visible(i, tier));
}

export function getCompanyOsMoreNavItems(tier: OsCapabilityTier | null = null): CompanyOsNavItem[] {
  return ALL.filter((i) => !i.primary).filter((i) => visible(i, tier));
}

export function getCompanyOsMobilePrimaryNavItems(
  _tier: OsCapabilityTier | null = null,
): CompanyOsNavItem[] {
  void _tier;
  return [
    { id: "home", label: "Home", icon: Home, href: "/os", primary: true },
    { id: "customers", label: "Customers", icon: Building2, href: "/os/customers", primary: true },
    { id: "work", label: "Work", icon: Briefcase, href: "/os/work", primary: true },
    { id: "sales", label: "Sales", icon: Target, href: "/os/sales", primary: true },
    { id: "more", label: "More", icon: MoreHorizontal, href: "#more" },
  ];
}

export function resolveCompanyOsActiveNavId(pathname: string): CompanyOsNavId | null {
  const path = pathname.split("?")[0]?.replace(/\/$/, "") || "/";
  if (path === "/os" || path === "/os/home") return "home";
  const map: Array<[string, CompanyOsNavId]> = [
    ["/os/founder", "founder"],
    ["/os/customers", "customers"],
    ["/os/sales", "sales"],
    ["/os/work", "work"],
    ["/os/studio", "studio"],
    ["/os/growth", "growth"],
    ["/os/ads", "ads"],
    ["/os/engineering", "engineering"],
    ["/os/ai", "ai"],
    ["/os/commerce", "commerce"],
    ["/os/finance", "finance"],
    ["/os/people", "people"],
    ["/os/logistics", "logistics"],
    ["/os/communication", "communication"],
    ["/os/academy", "academy"],
    ["/os/platforms", "platforms"],
    ["/os/assets", "assets"],
    ["/os/approvals", "approvals"],
    ["/os/reports", "reports"],
    ["/os/settings", "settings"],
  ];
  for (const [prefix, id] of map) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return id;
  }
  return null;
}

/** Workflow icon reserved for automate bridges still reachable from settings. */
export const COMPANY_OS_WORKFLOW_ICON = Workflow;
