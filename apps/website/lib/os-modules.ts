import type { LoginRole } from "@/components/rinpo/LoginModal";

/**
 * Dashboard card prototypes for Home (PR 2 will replace with command-centre sections).
 * Kept here so Home continues to render existing surfaces without fabricating new metrics.
 */
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

export function getOsCards(role: LoginRole = "client"): OsCardItem[] {
  void role;
  return [
    {
      id: "grow",
      title: "RINADS Grow",
      subtitle: "Marketing hub — SEO, paid media, social packages",
      meta: "New",
      href: "/os/growth",
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
      href: "/os/rooms",
    },
    {
      id: "growth",
      title: "Subscription Growth Experiments",
      subtitle: "Sprint retrospective · Team Alpha",
      meta: "9",
      href: "/os/work",
      size: "md",
    },
    {
      id: "insights",
      title: "Weekly Insights",
      subtitle: "Revenue, funnel, and retention KPIs",
      meta: "Live",
      href: "/os/growth",
      size: "md",
    },
    {
      id: "strategy",
      title: "Product Strategy 2026",
      subtitle: "No upcoming meetings",
      meta: "32",
      tone: "green",
      size: "sm",
      href: "/os/work",
    },
    {
      id: "onboarding",
      title: "User Onboarding Team",
      subtitle: "Sprint planning in progress",
      meta: "4",
      href: "/os/work/teams",
      size: "sm",
    },
    {
      id: "research",
      title: "User & Market Research",
      subtitle: "Discovery interviews queued",
      tone: "green",
      size: "sm",
      href: "/os/work",
    },
    {
      id: "core-team",
      title: "Core Product Team",
      subtitle: "Design · Engineering · Growth",
      meta: "6",
      size: "md",
      href: "/os/rooms",
    },
    {
      id: "screen-share",
      title: "Screen Share",
      subtitle: "Alice and Alex are presenting",
      meta: "Live",
      size: "lg",
      href: "/os/rooms",
    },
  ];
}

/** @deprecated Use getOsDesktopNavItems from os-nav. Kept for test migration window. */
export { getOsDesktopNavItems as getOsNavItems } from "@/lib/os-nav";
export type { OsNavId, OsNavItem } from "@/lib/os-nav";
