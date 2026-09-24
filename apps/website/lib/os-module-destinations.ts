import { getPortalUrls, portalUrl } from "@/lib/portal-urls";
import type { OsCapabilityTier } from "@/lib/os-org-role";
import { tierAtLeast } from "@/lib/os-org-role";

export type ModuleDestinationStatus = "available" | "external_public" | "unavailable";

export type ModuleDestination = {
  id: string;
  label: string;
  description: string;
  href?: string;
  external?: boolean;
  status: ModuleDestinationStatus;
  /** Minimum capability tier for authenticated product destinations. Omit for external_public / unavailable. */
  minTier?: OsCapabilityTier;
};

export type OsModuleBridgeConfig = {
  id: string;
  title: string;
  summary: string;
  destinations: ModuleDestination[];
};

export type FilteredModuleDestination = ModuleDestination & {
  /** Final visibility after role + configuration checks. */
  visible: boolean;
  reason?: "role" | "unconfigured" | "unresolved_role";
};

function portals() {
  return getPortalUrls();
}

function isPortalConfigured(kind: "owner" | "customer" | "platform"): boolean {
  const envKey =
    kind === "owner"
      ? "NEXT_PUBLIC_OWNER_PORTAL_URL"
      : kind === "customer"
        ? "NEXT_PUBLIC_CUSTOMER_PORTAL_URL"
        : "NEXT_PUBLIC_PLATFORM_ADMIN_URL";
  const value = process.env[envKey];
  // Explicitly configured OR local defaults from getPortalUrls() — treat as configured for demo/dev.
  // Unconfigured only when intentionally blank string.
  if (value === "") return false;
  return Boolean(portals()[kind]);
}

export function filterDestinationsForCapability(
  destinations: ModuleDestination[],
  tier: OsCapabilityTier | null
): FilteredModuleDestination[] {
  return destinations
    .map((destination): FilteredModuleDestination | null => {
      if (destination.status === "unavailable") {
        return { ...destination, visible: true };
      }

      if (destination.status === "external_public") {
        if (!destination.href) {
          return { ...destination, visible: false, reason: "unconfigured" };
        }
        return { ...destination, visible: true };
      }

      // available — authenticated product surface
      if (!destination.href) {
        return { ...destination, visible: false, reason: "unconfigured", status: "unavailable" };
      }

      if (destination.external) {
        const href = destination.href;
        const p = portals();
        if (href.startsWith(p.owner) && !isPortalConfigured("owner")) {
          return { ...destination, visible: false, reason: "unconfigured" };
        }
        if (href.startsWith(p.customer) && !isPortalConfigured("customer")) {
          return { ...destination, visible: false, reason: "unconfigured" };
        }
      }

      const required = destination.minTier ?? "client";
      if (!tier) {
        // Unresolved live role: hide privileged surfaces; allow in-shell client-safe only if minTier is client and not external portal ops.
        if (required === "client" && !destination.external) {
          return { ...destination, visible: true };
        }
        return { ...destination, visible: false, reason: "unresolved_role" };
      }

      if (!tierAtLeast(tier, required)) {
        return { ...destination, visible: false, reason: "role" };
      }

      return { ...destination, visible: true };
    })
    .filter((d): d is FilteredModuleDestination => d !== null && d.visible);
}

export function getCustomersModuleDestinations(): OsModuleBridgeConfig {
  const p = portals();
  return {
    id: "customers",
    title: "Customers",
    summary: "CRM and customer context for your organisation. Open existing customer tools from here.",
    destinations: [
      {
        id: "customer-portal",
        label: "Customer workspace",
        description: "Orders, profile, and support for customer-facing members.",
        href: portalUrl(p.customer, "/"),
        external: true,
        status: "available",
        minTier: "client",
      },
      {
        id: "customer-support",
        label: "Support inbox",
        description: "Customer support threads in the customer portal.",
        href: portalUrl(p.customer, "/support"),
        external: true,
        status: "available",
        minTier: "client",
      },
      {
        id: "leads-pipeline",
        label: "Leads & pipeline",
        description: "In-shell CRM pipeline is not available yet.",
        status: "unavailable",
      },
      {
        id: "contacts",
        label: "Contacts directory",
        description: "Unified contacts inside Business OS is not available yet.",
        status: "unavailable",
      },
    ],
  };
}

export function getWorkModuleDestinations(): OsModuleBridgeConfig {
  const p = portals();
  return {
    id: "work",
    title: "Work",
    summary: "Projects, teams, tasks, and calendar — consolidated under Work.",
    destinations: [
      {
        id: "projects",
        label: "Projects",
        description: "Start or continue a project conversation.",
        href: "/os/work/projects",
        status: "available",
        minTier: "client",
      },
      {
        id: "projects-legacy",
        label: "Project intake (public)",
        description: "Public project conversation form on the marketing site.",
        href: "/projects",
        status: "external_public",
      },
      {
        id: "teams",
        label: "Teams",
        description: "Team collaboration destinations.",
        href: "/os/work/teams",
        status: "available",
        minTier: "client",
      },
      {
        id: "owner-tasks",
        label: "Task queue (operations)",
        description: "Owner-portal task list. Authorization is enforced in the portal.",
        href: portalUrl(p.owner, "/tasks"),
        external: true,
        status: "available",
        minTier: "staff",
      },
      {
        id: "tasks",
        label: "Tasks",
        description: "First-class Business OS tasks module is not available yet.",
        status: "unavailable",
      },
      {
        id: "calendar",
        label: "Calendar",
        description: "Business OS calendar is not available yet.",
        status: "unavailable",
      },
    ],
  };
}

export function getWorkProjectsDestinations(): OsModuleBridgeConfig {
  return {
    id: "work-projects",
    title: "Projects",
    summary: "Projects live under Work. Use the existing intake to start a conversation.",
    destinations: [
      {
        id: "project-intake",
        label: "Project intake (public)",
        description: "Public project conversation form on the marketing site.",
        href: "/projects",
        status: "external_public",
      },
      {
        id: "project-workspace",
        label: "Project workspaces",
        description: "In-shell project boards are not available yet.",
        status: "unavailable",
      },
    ],
  };
}

export function getWorkTeamsDestinations(): OsModuleBridgeConfig {
  const p = portals();
  return {
    id: "work-teams",
    title: "Teams",
    summary: "Teams participate in Rooms and work queues. Open supported destinations below.",
    destinations: [
      {
        id: "owner-tasks",
        label: "Team task queue",
        description: "Operations task surface. Authorization is enforced in the portal.",
        href: portalUrl(p.owner, "/tasks"),
        external: true,
        status: "available",
        minTier: "staff",
      },
      {
        id: "rooms",
        label: "Collaborate in Rooms",
        description: "Open the Rooms collaboration layer.",
        href: "/os/rooms",
        status: "available",
        minTier: "client",
      },
      {
        id: "team-directory",
        label: "Team directory",
        description: "In-shell team management is not available yet.",
        status: "unavailable",
      },
    ],
  };
}

export function getMoneyModuleDestinations(): OsModuleBridgeConfig {
  const p = portals();
  return {
    id: "money",
    title: "Money",
    summary: "Financial operations. Existing billing tools remain reachable; accounting logic is unchanged.",
    destinations: [
      {
        id: "billing-settings",
        label: "Billing settings",
        description: "Organisation billing configuration. Authorization is enforced in the portal.",
        href: portalUrl(p.owner, "/settings/billing"),
        external: true,
        status: "available",
        minTier: "admin",
      },
      {
        id: "orders",
        label: "Orders",
        description: "Commerce order list. Authorization is enforced in the portal.",
        href: portalUrl(p.owner, "/orders"),
        external: true,
        status: "available",
        minTier: "staff",
      },
      {
        id: "invoices",
        label: "Invoices",
        description: "In-shell invoicing is not available yet.",
        status: "unavailable",
      },
      {
        id: "receivables",
        label: "Receivables",
        description: "Receivables workspace is not available yet.",
        status: "unavailable",
      },
    ],
  };
}

export function getGrowthModuleDestinations(): OsModuleBridgeConfig {
  return {
    id: "growth",
    title: "Growth",
    summary: "Marketing and revenue operations. Public Grow overview is separate from in-app campaign tools.",
    destinations: [
      {
        id: "marketing-os",
        label: "RINADS Grow overview",
        description: "Public Marketing OS page — not an authenticated campaign console.",
        href: "/platform/marketing-os",
        status: "external_public",
      },
      {
        id: "campaigns",
        label: "Campaign workspace",
        description: "In-shell campaign manager is not available yet.",
        status: "unavailable",
      },
      {
        id: "seo",
        label: "SEO hub",
        description: "Dedicated SEO module is not available yet.",
        status: "unavailable",
      },
    ],
  };
}

export function getAutomateModuleDestinations(): OsModuleBridgeConfig {
  const p = portals();
  return {
    id: "automate",
    title: "Automate",
    summary: "Workflows, approvals, and runs. Open supported automation surfaces from here.",
    destinations: [
      {
        id: "automation-os",
        label: "Automation OS overview",
        description: "Public Automation OS page — not an authenticated workflow builder.",
        href: "/platform/automation-os",
        status: "external_public",
      },
      {
        id: "approvals",
        label: "Approvals",
        description: "Approvals queue. Authorization is enforced in the portal.",
        href: portalUrl(p.owner, "/approvals"),
        external: true,
        status: "available",
        minTier: "staff",
      },
      {
        id: "runtime",
        label: "Runtime & executions",
        description: "Workflow runtime status. Authorization is enforced in the portal.",
        href: portalUrl(p.owner, "/runtime"),
        external: true,
        status: "available",
        minTier: "staff",
      },
      {
        id: "integrations",
        label: "Integrations",
        description: "In-shell integrations manager is not available yet.",
        status: "unavailable",
      },
      {
        id: "builder",
        label: "Workflow builder",
        description: "In-shell automation builder is not available yet.",
        status: "unavailable",
      },
    ],
  };
}

export function getSettingsModuleDestinations(): OsModuleBridgeConfig {
  const p = portals();
  return {
    id: "settings",
    title: "Settings",
    summary: "Workspace and organisation settings. Reach existing configuration tools below.",
    destinations: [
      {
        id: "billing",
        label: "Billing settings",
        description: "Subscription and billing configuration. Authorization is enforced in the portal.",
        href: portalUrl(p.owner, "/settings/billing"),
        external: true,
        status: "available",
        minTier: "admin",
      },
      {
        id: "domains",
        label: "Domains",
        description: "Organisation domain settings. Authorization is enforced in the portal.",
        href: portalUrl(p.owner, "/settings/domains"),
        external: true,
        status: "available",
        minTier: "admin",
      },
      {
        id: "org-settings",
        label: "Organisation profile",
        description: "In-shell organisation editor is not available yet.",
        status: "unavailable",
      },
    ],
  };
}
