export type NavStatus = "Available" | "Pilot" | "Preview" | "Roadmap";

export type NavLink = {
  label: string;
  href: string;
  external?: boolean;
  description?: string;
  section?: string;
  status?: NavStatus;
};

export type NavGroup = {
  label: string;
  href?: string;
  items: NavLink[];
  variant?: "dropdown" | "mega";
};

export const POSITIONING = {
  hero: "Business Intelligence Infrastructure for Software-Defined Business.",
  support: "Powered by RINADS INTELLIGENCE. Executed by RINPO RUNTIME.",
  closing: "Business, simplified.",
  equation: "Observe → Understand → Recommend → Authorize → Act → Audit",
  category: "Business Intelligence Infrastructure",
} as const;

/**
 * Canonical public architecture (Brand & Social System v1.0).
 * RINADS → RINADS INTELLIGENCE → RINPO RUNTIME → RI ID + RI SPACE →
 * Industry RINASPACES → Connectors / Automations / Marketplace / RI LABS.
 * RI ID, RI SPACE, and RINASPACE infrastructure are direction / roadmap
 * unless a specific surface is independently marked live or pilot.
 */
export const ARCHITECTURE_LAYERS = [
  {
    id: "rinads",
    label: "RINADS",
    description: "Business Intelligence Infrastructure for Software-Defined Business.",
  },
  {
    id: "intelligence",
    label: "RINADS INTELLIGENCE",
    description: "Intelligence, orchestration and decision layer.",
  },
  {
    id: "runtime",
    label: "RINPO RUNTIME",
    description: "Execution, automation and autonomy engine behind RINPO.",
  },
  {
    id: "identity-space",
    label: "RI ID + RI SPACE",
    description:
      "Identity and workspace direction — not a claim that RI ID or RI SPACE infrastructure is generally available.",
  },
  {
    id: "rinaspace",
    label: "Industry RINASPACES",
    description:
      "Industry environments such as RI SALON RINASPACE. Individual editions carry their own availability.",
  },
  {
    id: "extensions",
    label: "Connectors · Automations · Marketplace · RI LABS",
    description:
      "Integration, governed automation, extensions, and learning — each at its published status.",
  },
] as const;

export const PRODUCT_HIERARCHY = {
  platform: {
    label: "RINADS Platform",
    href: "/platform",
    description: "Business Intelligence Infrastructure for Software-Defined Business.",
  },
  business: {
    label: "Business",
    href: "/platform/business",
    appHref: "/os",
    description: "Customers, work, money, growth, and automation on the shared platform.",
  },
  rinpo: {
    label: "RINPO",
    href: "/rinpo",
    description: "Business intelligence character and user-facing intelligence interface.",
  },
  intelligence: {
    label: "RINADS INTELLIGENCE",
    href: "/platform/intelligence",
    description: "Intelligence, orchestration and decision layer.",
  },
  runtime: {
    label: "RINPO RUNTIME",
    href: "/platform/rinpo-runtime",
    description: "The governed execution layer behind RINPO.",
  },
  cloud: {
    label: "RINADS Platform",
    href: "/platform/cloud",
    description: "Shared identity, data, APIs, events, and infrastructure.",
  },
  rinaspace: {
    label: "Industry RINASPACES",
    href: "/rinaspace",
    description: "Industry environments configured on the RINADS platform.",
  },
  academy: {
    label: "RI LABS",
    href: "/labs",
    description: "Learning, certification, training and experimentation.",
  },
  services: {
    label: "RINADS Implementation Services",
    href: "/services",
    description: "Implementation capability surrounding the platform.",
  },
} as const;

/** @deprecated Prefer PRODUCT_HIERARCHY.business */
export const PLATFORM_OS_LEGACY_NOTE = "OS modules redirect to platform pillars.";

export const PLATFORM_NAV_ITEMS: NavLink[] = [
  {
    label: "Overview",
    href: "/platform",
    description: "RINADS architecture — intelligence, runtime, identity, workspace direction, and RINASPACES.",
    section: "Platform",
  },
  {
    label: "Business",
    href: "/platform/business",
    description: "Customers, CRM, projects, finance, and people.",
    section: "Platform",
    status: "Pilot",
  },
  {
    label: "Commerce",
    href: "/platform/commerce",
    description: "Products, orders, payments, and fulfilment.",
    section: "Platform",
    status: "Pilot",
  },
  {
    label: "Growth",
    href: "/platform/growth",
    description: "Leads, marketing, content, and campaigns.",
    section: "Platform",
    status: "Preview",
  },
  {
    label: "Automation",
    href: "/platform/automation",
    description: "Workflows, agents, approvals, and integrations.",
    section: "Platform",
    status: "Preview",
  },
  {
    label: "RINADS INTELLIGENCE",
    href: "/platform/intelligence",
    description: "Understand, reason, recommend, and orchestrate.",
    section: "Core",
    status: "Pilot",
  },
  {
    label: "RINPO RUNTIME",
    href: "/platform/rinpo-runtime",
    description: "Governed execution behind RINPO.",
    section: "Core",
    status: "Pilot",
  },
  {
    label: "RINADS Platform",
    href: "/platform/cloud",
    description: "Identity, data, APIs, events, and infrastructure.",
    section: "Core",
    status: "Pilot",
  },
];

/** @deprecated Prefer PLATFORM_NAV_ITEMS */
export const PLATFORM_OS = PLATFORM_NAV_ITEMS;

export const NAV_PRODUCT: NavGroup = {
  label: "Platform",
  href: "/platform",
  items: PLATFORM_NAV_ITEMS,
  variant: "mega",
};

/** @deprecated Prefer NAV_PRODUCT */
export const NAV_PLATFORM = NAV_PRODUCT;

export const NAV_RINPO: NavGroup = {
  label: "RINPO",
  href: "/rinpo",
  items: [
    { label: "Overview", href: "/rinpo", description: "Meet RINPO — the RINADS intelligence interface." },
    { label: "Phone", href: "/rinpo/phone", description: "RINPO PHONE — conversational and action surface." },
    { label: "Voice", href: "/rinpo/voice", description: "Voice interface (lazy-loaded)." },
    { label: "Live", href: "/rinpo/live", description: "Meet RINPO on live video, in your language." },
    { label: "Agents", href: "/platform/rinpo-runtime", description: "Agent capabilities under Runtime governance." },
    { label: "Runtime", href: "/platform/rinpo-runtime", description: "RINPO RUNTIME — execution behind RINPO." },
  ],
};

export const NAV_SOLUTIONS: NavGroup = {
  label: "Solutions",
  href: "/solutions",
  variant: "mega",
  items: [
    {
      label: "Industry RINASPACES",
      href: "/rinaspace",
      description: "Industry environments on the RINADS platform.",
      section: "Explore",
    },
    {
      label: "By Outcome",
      href: "/use-cases",
      description: "High-intent problem and use-case pages.",
      section: "Explore",
    },
    {
      label: "RI SALON RINASPACE",
      href: "/solutions/salon",
      description: "Appointments, clients, services, loyalty, and campaigns. Pilot — R GLOW is the current implementation name.",
      section: "RINASPACES",
      status: "Pilot",
    },
    {
      label: "RI JEWELLERY RINASPACE",
      href: "/solutions/jewellery",
      description: "Collections, inventory, orders, and campaigns.",
      section: "RINASPACES",
      status: "Roadmap",
    },
    {
      label: "RI LANDSCAPE RINASPACE",
      href: "/solutions/landscape",
      description: "Inventory, project work, field operations, and customers.",
      section: "RINASPACES",
      status: "Preview",
    },
    {
      label: "Retail RINASPACE",
      href: "/solutions/retail",
      description: "Catalogue, inventory, storefront, and orders.",
      section: "RINASPACES",
      status: "Preview",
    },
    {
      label: "Logistics RINASPACE",
      href: "/solutions/logistics",
      description: "Shipment operations and exception control.",
      section: "RINASPACES",
      status: "Roadmap",
    },
  ],
};

export const NAV_CUSTOMERS: NavGroup = {
  label: "Customers",
  href: "/customers",
  items: [
    { label: "Customer Stories", href: "/customers#stories", description: "Verified customer narratives only." },
    { label: "Deployments", href: "/customers#deployments", description: "Verified deployment evidence." },
    { label: "Product Demonstrations", href: "/customers#demonstrations", description: "Demo and sample experiences." },
    { label: "RI LABS", href: "/customers#labs", description: "Internal labs and experiments." },
  ],
};

export const NAV_PRICING: NavGroup = {
  label: "Pricing",
  href: "/pricing",
  items: [
    { label: "Plans", href: "/pricing", description: "Start, Grow, Scale, and Enterprise packaging." },
    { label: "Book a demo", href: "/company/contact?intent=sales", description: "Discuss the right commercial path." },
  ],
};

export const NAV_SERVICES: NavGroup = {
  label: "Services",
  href: "/services",
  items: [
    { label: "Software Implementation", href: "/services#software-implementation" },
    { label: "System Integration", href: "/services#system-integration" },
    { label: "Intelligence & Automation", href: "/services#ai-automation" },
    { label: "Migration", href: "/services#migration" },
    { label: "Business Transformation", href: "/services#business-transformation" },
    { label: "Growth Systems", href: "/services#growth-systems" },
    { label: "Creative Systems", href: "/services#creative-systems" },
    { label: "Training", href: "/services#training" },
  ],
};

export const NAV_ACADEMY: NavGroup = {
  label: "RI LABS",
  href: "/labs",
  items: [
    { label: "RI LABS overview", href: "/labs" },
    { label: "Programs", href: "/academy/programs" },
  ],
};

export const NAV_RESOURCES: NavGroup = {
  label: "Resources",
  href: "/resources",
  items: [
    { label: "RI LABS", href: "/labs", description: "Learning, certification, training and experimentation." },
    { label: "Docs", href: "/resources/docs", description: "Platform documentation." },
    { label: "Developers", href: "/resources/developers", description: "APIs, auth, webhooks, and events." },
    { label: "Guides", href: "/resources/guides", description: "Practical operating guides." },
    {
      label: "Business Readiness",
      href: "/business-readiness",
      description: "Interactive operating assessment — not a certification.",
    },
    { label: "Case Studies", href: "/resources/case-studies", description: "Verified evidence only." },
  ],
};

export const NAV_COMPANY: NavGroup = {
  label: "Company",
  href: "/company",
  items: [
    { label: "Company", href: "/company" },
    { label: "Founder", href: "/company/founder" },
    { label: "Story", href: "/company/story" },
    { label: "Careers", href: "/company/careers" },
    { label: "Contact", href: "/company/contact" },
  ],
};

/**
 * Primary marketing navigation — exactly one global shell.
 * Trust and Company live primarily in the footer.
 */
export const NAV_GROUPS: NavGroup[] = [
  NAV_PRODUCT,
  NAV_RINPO,
  NAV_SOLUTIONS,
  NAV_SERVICES,
  NAV_CUSTOMERS,
  NAV_RESOURCES,
];

export const FOOTER_PLATFORM: NavLink[] = [
  { label: "Platform Overview", href: "/platform" },
  { label: "Business", href: "/platform/business" },
  { label: "Commerce", href: "/platform/commerce" },
  { label: "RINADS INTELLIGENCE", href: "/platform/intelligence" },
  { label: "RINPO RUNTIME", href: "/platform/rinpo-runtime" },
  { label: "RINADS Platform", href: "/platform/cloud" },
  { label: "Industry RINASPACES", href: "/rinaspace" },
  { label: "RINPO", href: "/rinpo" },
  { label: "Pricing", href: "/pricing" },
];

export const FOOTER_SOLUTIONS: NavLink[] = [
  { label: "RI SALON RINASPACE", href: "/solutions/salon" },
  { label: "Retail RINASPACE", href: "/solutions/retail" },
  { label: "RI LANDSCAPE RINASPACE", href: "/solutions/landscape" },
  { label: "All RINASPACES", href: "/rinaspace" },
];

export const FOOTER_COMPANY: NavLink[] = [
  { label: "Company", href: "/company" },
  { label: "Founder", href: "/company/founder" },
  { label: "Story", href: "/company/story" },
  { label: "Contact", href: "/company/contact" },
  { label: "Careers", href: "/company/careers" },
];

export const FOOTER_TRUST: NavLink[] = [
  { label: "Security", href: "/trust/security" },
  { label: "Availability", href: "/trust/availability" },
  { label: "Privacy", href: "/trust/privacy" },
  { label: "Status", href: "/trust/status" },
];

export const FOOTER_RESOURCES: NavLink[] = [
  { label: "Resources Hub", href: "/resources" },
  { label: "RI LABS", href: "/labs" },
  { label: "Business Readiness", href: "/business-readiness" },
  { label: "Documentation", href: "/resources/docs" },
  { label: "Services", href: "/services" },
];

export const FOOTER_LEGAL: NavLink[] = [
  { label: "Privacy Policy", href: "/company/privacy" },
  { label: "Terms of Service", href: "/company/terms" },
  { label: "Cookie Policy", href: "/company/cookies" },
  { label: "DPA", href: "/legal/dpa" },
  { label: "Subprocessors", href: "/legal/subprocessors" },
];

/** @deprecated Prefer FOOTER_PLATFORM */
export const FOOTER_PRODUCTS = FOOTER_PLATFORM;

export const BRAND_EQUATION = {
  tagline: POSITIONING.equation,
  run: "Business",
  sell: "Commerce",
  grow: "Growth",
  automate: "Automation, executed by RINPO RUNTIME",
} as const;

export const HERO_COMMANDS = [
  "What needs my attention today?",
  "Which leads need follow-up?",
  "Show overdue payments.",
  "What should my team focus on?",
  "Help me automate a workflow.",
  "Which Industry RINASPACE fits my business?",
] as const;

/** Re-export navbar-shaped CTAs from the single taxonomy in lib/ctas.ts */
export { NAV_CTAS as CTAS } from "@/lib/ctas";
export { CTAS as CTA_TAXONOMY } from "@/lib/ctas";
