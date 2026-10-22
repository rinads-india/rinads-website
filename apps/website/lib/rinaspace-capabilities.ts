export type RinaSpaceCapabilityStatus = "live" | "preview" | "soon";

export type RinaSpaceSectionId =
  | "run"
  | "grow"
  | "sell"
  | "create"
  | "build"
  | "learn"
  | "experience";

export type RinaSpaceCapability = {
  id: string;
  label: string;
  description: string;
  href: string;
  roles: string[];
  status: RinaSpaceCapabilityStatus;
};

export type RinaSpaceSection = {
  id: RinaSpaceSectionId;
  label: string;
  description: string;
  capabilities: RinaSpaceCapability[];
};

const ALL_AUTHENTICATED = ["owner", "founder", "admin", "staff", "member", "customer"];
const BUSINESS_USERS = ["owner", "founder", "admin", "staff", "member"];
const ADMIN_USERS = ["owner", "founder", "admin"];

/**
 * Wave 0 RINASPACE capability registry.
 *
 * This registry intentionally points only at routes that exist in the canonical
 * website application. Entitlement-based filtering will replace role-only
 * filtering in a later wave; keeping the registry centralized prevents new
 * workspace shells from hard-coding their own navigation models.
 */
export const RINASPACE_SECTIONS: RinaSpaceSection[] = [
  {
    id: "run",
    label: "Run",
    description: "Operate the company, customers, work, money and approvals.",
    capabilities: [
      {
        id: "business-os",
        label: "Business OS",
        description: "Open the operating workspace for your organization.",
        href: "/os",
        roles: BUSINESS_USERS,
        status: "live",
      },
      {
        id: "customers",
        label: "Customers",
        description: "Manage customer records, relationships and activity.",
        href: "/os/customers",
        roles: BUSINESS_USERS,
        status: "live",
      },
      {
        id: "work",
        label: "Work",
        description: "Projects, tasks and operational work in one place.",
        href: "/os/work",
        roles: BUSINESS_USERS,
        status: "live",
      },
      {
        id: "finance",
        label: "Finance",
        description: "Operating finance and finance-control surfaces.",
        href: "/os/finance",
        roles: ADMIN_USERS,
        status: "preview",
      },
      {
        id: "approvals",
        label: "Approvals",
        description: "Review governed actions before execution.",
        href: "/os/approvals",
        roles: ADMIN_USERS,
        status: "live",
      },
    ],
  },
  {
    id: "grow",
    label: "Grow",
    description: "Marketing, advertising, leads and business communication.",
    capabilities: [
      {
        id: "growth",
        label: "Growth",
        description: "Marketing and revenue-growth workspace.",
        href: "/os/growth",
        roles: BUSINESS_USERS,
        status: "live",
      },
      {
        id: "ads",
        label: "Ads",
        description: "Paid-media planning and execution workspace.",
        href: "/os/ads",
        roles: ADMIN_USERS,
        status: "preview",
      },
      {
        id: "communication",
        label: "Communication",
        description: "Business communication, calls and messaging workflows.",
        href: "/os/communication",
        roles: BUSINESS_USERS,
        status: "preview",
      },
    ],
  },
  {
    id: "sell",
    label: "Sell",
    description: "Commerce and governed logistics capabilities.",
    capabilities: [
      {
        id: "commerce",
        label: "Commerce",
        description: "Commerce operations and selling capabilities.",
        href: "/os/commerce",
        roles: BUSINESS_USERS,
        status: "live",
      },
      {
        id: "logistics",
        label: "Logistics",
        description: "Provider-neutral shipment planning and readiness.",
        href: "/os/logistics",
        roles: BUSINESS_USERS,
        status: "preview",
      },
    ],
  },
  {
    id: "create",
    label: "Create",
    description: "Creative production, assets and RINADS STUDIOS workflows.",
    capabilities: [
      {
        id: "studio",
        label: "Studio",
        description: "Creative workspace for production and asset workflows.",
        href: "/os/studio",
        roles: BUSINESS_USERS,
        status: "preview",
      },
      {
        id: "assets",
        label: "Assets",
        description: "Shared business and creative asset workspace.",
        href: "/os/assets",
        roles: BUSINESS_USERS,
        status: "preview",
      },
    ],
  },
  {
    id: "build",
    label: "Build",
    description: "Software, automation and AI capability surfaces.",
    capabilities: [
      {
        id: "engineering",
        label: "Engineering",
        description: "Software and implementation workspaces.",
        href: "/os/engineering",
        roles: ADMIN_USERS,
        status: "preview",
      },
      {
        id: "automate",
        label: "Automate",
        description: "Integrations and governed business automation.",
        href: "/os/automate",
        roles: ADMIN_USERS,
        status: "live",
      },
      {
        id: "ai",
        label: "RINADS Intelligence",
        description: "AI and intelligence capability surface.",
        href: "/os/ai",
        roles: ADMIN_USERS,
        status: "preview",
      },
    ],
  },
  {
    id: "learn",
    label: "Learn",
    description: "Academy, Labs and future verified-work experiences.",
    capabilities: [
      {
        id: "academy",
        label: "Academy",
        description: "Learning and practical business education.",
        href: "/os/academy",
        roles: BUSINESS_USERS,
        status: "preview",
      },
    ],
  },
  {
    id: "experience",
    label: "Experience",
    description: "RINPO Phone and the spatial RINADS WORLD layer.",
    capabilities: [
      {
        id: "phone",
        label: "RINPO Phone",
        description: "Portable RINPO interaction and business interface.",
        href: "/phone",
        roles: ALL_AUTHENTICATED,
        status: "preview",
      },
      {
        id: "world",
        label: "RINADS WORLD",
        description: "Enter the spatial and digital-twin experience layer.",
        href: "/world",
        roles: ALL_AUTHENTICATED,
        status: "preview",
      },
    ],
  },
];

export function canAccessRinaSpaceCapability(role: string, capability: RinaSpaceCapability): boolean {
  const normalizedRole = role.toLowerCase();
  return capability.roles.includes(normalizedRole) || normalizedRole === "owner" || normalizedRole === "founder";
}

export function getRinaSpaceSectionsForRole(role: string): RinaSpaceSection[] {
  return RINASPACE_SECTIONS.map((section) => ({
    ...section,
    capabilities: section.capabilities.filter((capability) =>
      canAccessRinaSpaceCapability(role, capability),
    ),
  })).filter((section) => section.capabilities.length > 0);
}
