import { getPortalUrls, portalUrl } from "@/lib/portal-urls";

export type ModuleDestinationStatus = "available" | "unavailable";

export type ModuleDestination = {
  id: string;
  label: string;
  description: string;
  href?: string;
  external?: boolean;
  status: ModuleDestinationStatus;
};

export type OsModuleBridgeConfig = {
  id: string;
  title: string;
  summary: string;
  destinations: ModuleDestination[];
};

function portals() {
  return getPortalUrls();
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
      },
      {
        id: "customer-support",
        label: "Support inbox",
        description: "Customer support threads in the customer portal.",
        href: portalUrl(p.customer, "/support"),
        external: true,
        status: "available",
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
      },
      {
        id: "projects-legacy",
        label: "Project intake (legacy)",
        description: "Existing public project intake form.",
        href: "/projects",
        status: "available",
      },
      {
        id: "teams",
        label: "Teams",
        description: "Team collaboration destinations.",
        href: "/os/work/teams",
        status: "available",
      },
      {
        id: "owner-tasks",
        label: "Task queue (operations)",
        description: "Existing owner-portal task list when configured.",
        href: portalUrl(p.owner, "/tasks"),
        external: true,
        status: "available",
      },
      {
        id: "tasks",
        label: "Tasks",
        description: "First-class Business OS tasks module is not available yet.",
        href: "/os/work/tasks",
        status: "unavailable",
      },
      {
        id: "calendar",
        label: "Calendar",
        description: "Business OS calendar is not available yet.",
        href: "/os/work/calendar",
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
        label: "Open project intake",
        description: "Existing project conversation form.",
        href: "/projects",
        status: "available",
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
        description: "Existing operations task surface.",
        href: portalUrl(p.owner, "/tasks"),
        external: true,
        status: "available",
      },
      {
        id: "rooms",
        label: "Collaborate in Rooms",
        description: "Open the Rooms collaboration layer.",
        href: "/os/rooms",
        status: "available",
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
        description: "Organisation billing configuration.",
        href: portalUrl(p.owner, "/settings/billing"),
        external: true,
        status: "available",
      },
      {
        id: "orders",
        label: "Orders",
        description: "Commerce order list in the owner portal.",
        href: portalUrl(p.owner, "/orders"),
        external: true,
        status: "available",
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
    summary: "Marketing and revenue operations. Open RINADS Grow and related experiences.",
    destinations: [
      {
        id: "marketing-os",
        label: "RINADS Grow / Marketing OS",
        description: "Plan, launch, and measure growth programmes.",
        href: "/platform/marketing-os",
        status: "available",
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
        label: "Automation OS",
        description: "Workflows, approvals, and actions overview.",
        href: "/platform/automation-os",
        status: "available",
      },
      {
        id: "approvals",
        label: "Approvals",
        description: "Existing approvals queue in operations.",
        href: portalUrl(p.owner, "/approvals"),
        external: true,
        status: "available",
      },
      {
        id: "runtime",
        label: "Runtime & executions",
        description: "Workflow runtime status.",
        href: portalUrl(p.owner, "/runtime"),
        external: true,
        status: "available",
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
        description: "Subscription and billing configuration.",
        href: portalUrl(p.owner, "/settings/billing"),
        external: true,
        status: "available",
      },
      {
        id: "domains",
        label: "Domains",
        description: "Organisation domain settings.",
        href: portalUrl(p.owner, "/settings/domains"),
        external: true,
        status: "available",
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
