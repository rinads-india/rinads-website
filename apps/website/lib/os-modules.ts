import type { LoginRole } from "@/components/rinpo/LoginModal";
import { getPortalUrls, portalUrl } from "@/lib/portal-urls";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Briefcase,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

export type OsNavId = "dashboard" | "teams" | "projects" | "analytics" | "settings";

export type OsNavItem = {
  id: OsNavId;
  label: string;
  icon: LucideIcon;
  href: string;
  external?: boolean;
};

export type OsCardItem = {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  href?: string;
  external?: boolean;
  tone?: "default" | "green" | "muted";
  size?: "sm" | "md" | "lg";
};

function resolveRoleKey(role: LoginRole): "owner" | "customer" | "platform" {
  if (role === "founder" || role === "super-admin" || role === "admin") {
    return role === "founder" || role === "super-admin" ? "platform" : "owner";
  }
  if (role === "staff") return "owner";
  return "customer";
}

export function getOsNavItems(role: LoginRole = "client"): OsNavItem[] {
  const portals = getPortalUrls();
  const persona = resolveRoleKey(role);

  const dashboardHref =
    persona === "platform"
      ? portalUrl(portals.platform, "/")
      : persona === "owner"
        ? portalUrl(portals.owner, "/operations")
        : portalUrl(portals.customer, "/");

  const teamsHref =
    persona === "customer"
      ? portalUrl(portals.customer, "/support")
      : portalUrl(portals.owner, "/tasks");

  const projectsHref = "/projects";
  const analyticsHref =
    persona === "platform"
      ? portalUrl(portals.platform, "/billing/events")
      : portalUrl(portals.owner, "/operations");

  const settingsHref =
    persona === "platform"
      ? portalUrl(portals.platform, "/tenants")
      : portalUrl(portals.owner, "/settings/billing");

  return [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      href: dashboardHref,
      external: dashboardHref.startsWith("http"),
    },
    {
      id: "teams",
      label: "Teams",
      icon: Users,
      href: teamsHref,
      external: teamsHref.startsWith("http"),
    },
    {
      id: "projects",
      label: "Projects",
      icon: Briefcase,
      href: projectsHref,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      href: analyticsHref,
      external: analyticsHref.startsWith("http"),
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: settingsHref,
      external: settingsHref.startsWith("http"),
    },
  ];
}

export function getOsCards(role: LoginRole = "client"): OsCardItem[] {
  const portals = getPortalUrls();
  const persona = resolveRoleKey(role);

  return [
    {
      id: "grow",
      title: "RINADS Grow",
      subtitle: "Marketing hub — SEO, paid media, social packages",
      meta: "New",
      href: "/grow",
      tone: "green",
      size: "md",
    },
    {
      id: "create-room",
      title: "Create a room",
      subtitle: "Start a collaborative workspace",
      meta: "+",
      tone: "muted",
      size: "sm",
    },
    {
      id: "growth",
      title: "Subscription Growth Experiments",
      subtitle: "Sprint retrospective · Team Alpha",
      meta: "9",
      href:
        persona === "owner"
          ? portalUrl(portals.owner, "/operations")
          : undefined,
      external: true,
      size: "md",
    },
    {
      id: "insights",
      title: "Weekly Insights",
      subtitle: "Revenue, funnel, and retention KPIs",
      meta: "Live",
      href:
        persona === "owner"
          ? portalUrl(portals.owner, "/runtime")
          : portalUrl(portals.customer, "/"),
      external: true,
      size: "md",
    },
    {
      id: "strategy",
      title: "Product Strategy 2026",
      subtitle: "No upcoming meetings",
      meta: "32",
      tone: "green",
      size: "sm",
    },
    {
      id: "onboarding",
      title: "User Onboarding Team",
      subtitle: "Sprint planning in progress",
      meta: "4",
      href: portalUrl(portals.owner, "/tasks"),
      external: true,
      size: "sm",
    },
    {
      id: "research",
      title: "User & Market Research",
      subtitle: "Discovery interviews queued",
      tone: "green",
      size: "sm",
    },
    {
      id: "core-team",
      title: "Core Product Team",
      subtitle: "Design · Engineering · Growth",
      meta: "6",
      size: "md",
    },
    {
      id: "screen-share",
      title: "Screen Share",
      subtitle: "Alice and Alex are presenting",
      meta: "Live",
      size: "lg",
    },
  ];
}
