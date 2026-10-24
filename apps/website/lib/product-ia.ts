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
  hero: "Run your business through intelligence.",
  support:
    "One platform for customers, work, commerce, growth and automation—with RINPO helping your team understand what matters and move approved work forward.",
  closing: "Clarity → experience → proof → conversion → governed intelligence.",
  equation: "RUN · SELL · GROW · AUTOMATE",
  category: "Business Intelligence Platform",
} as const;

/**
 * Canonical public architecture relationship.
 * RINPO communicates → RINADS Intelligence understands → RINPO Runtime executes → RI ID + RI SPACE carry identity and persistent business context.
 */
export const ARCHITECTURE_LAYERS = [
  {
    id: "rinpo",
    label: "RINPO",
    description: "Persistent Business Intelligence Character — the primary human interface.",
  },
  {
    id: "intelligence",
    label: "RINADS Intelligence",
    description: "Understands context, reasons over business data, recommends, and routes workloads.",
  },
  {
    id: "runtime",
    label: "RINPO Runtime",
    description: "Governed execution: agents, tools, workflows, triggers, permissions, approvals, and audit.",
  },
  {
    id: "core",
    label: "RINADS Platform Core",
    description: "Connected business capabilities for customers, work, commerce, growth, automation, and industry workflows.",
  },
  {
    id: "cloud",
    label: "RI ID + RI SPACE",
    description: "One identity and one persistent workspace carrying organisation context, permissions, data, and connected business state.",
  },
] as const;

export const PRODUCT_HIERARCHY = {
  platform: {
    label: "Platform",
    href: "/platform",
    description: "The business intelligence platform for software-defined businesses.",
  },
  business: {
    label: "Business",
    href: "/platform/business",
    appHref: "/os",
    description: "Run customers, work, money, growth, and automation.",
  },
  rinpo: {
    label: "RINPO",
    href: "/rinpo",
    description: "The persistent Business Intelligence Character for RINADS.",
  },
  intelligence: {
    label: "RINADS Intelligence",
    href: "/platform/intelligence",
    description: "Context, recommendations, orchestration, and governed intelligence.",
  },
  runtime: {
    label: "RINPO Runtime",
    href: "/platform/rinpo-runtime",
    description: "The governed execution layer behind RINPO.",
  },
  cloud: {
    label: "RI ID + RI SPACE",
    href: "/platform/cloud",
    description: "Identity and the persistent business workspace behind RINADS.",
  },
  academy: {
    label: "RI LABS",
    href: "/resources/academy",
    description: "Learn, build, test, and gain operating experience with RINADS.",
  },
  services: {
    label: "RINADS Implementation Services",
    href: "/services",
    description: "Implementation capability surrounding the platform.",
  },
} as const;

/** @deprecated Prefer PRODUCT_HIERARCHY.business */
export const PLATFORM_OS_LEGACY_NOTE = "Legacy OS routes remain for backward compatibility while public taxonomy migrates to the RINADS platform architecture.";

export const PLATFORM_NAV_ITEMS: NavLink[] = [
  {
    label: "Overview",
    href: "/platform",
    description: "How RINADS connects customers, work, commerce, growth, and automation.",
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
    label: "RINADS Intelligence",
    href: "/platform/intelligence",
    description: "Understand, reason, recommend, and orchestrate.",
    section: "Core",
    status: "Pilot",
  },
  {
    label: "RINPO Runtime",
    href: "/platform/rinpo-runtime",
    description: "Governed execution behind RINPO.",
    section: "Core",
    status: "Pilot",
  },
  {
    label: "RI ID + RI SPACE",
    href: "/platform/cloud",
    description: "Identity, persistent workspace, data, APIs, events, and integrations.",
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
    { label: "Overview", href: "/rinpo", description: "Meet the Business Intelligence Character." },
    { label: "Phone", href: "/rinpo/phone", description: "The RINPO Phone experience." },
    { label: "Voice", href: "/rinpo/voice", description: "Voice interface (lazy-loaded)." },
    { label: "Live", href: "/rinpo/live", description: "Talk to RINPO on live video, in your language." },
    { label: "Agents", href: "/platform/rinpo-runtime", description: "Agent capabilities under Runtime governance." },
    { label: "Runtime", href: "/platform/rinpo-runtime", description: "Execution layer behind RINPO." },
  ],
};

export const NAV_SOLUTIONS: NavGroup = {
  label: "Solutions",
  href: "/solutions",
  variant: "mega",
  items: [
    {
      label: "Industry RINASPACES",
      href: "/solutions",
      description: "Industry configurations built on the shared RINADS platform core.",
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
      description: "Appointments, clients, services, loyalty, campaigns, and salon operations.",
      section: "Industry RINASPACE",
      status: "Pilot",
    },
    {
      label: "RI JEWELLERY RINASPACE",
      href: "/solutions/jewellery",
      description: "Collections, inventory, orders, customer journeys, and campaigns.",
      section: "Industry RINASPACE",
      status: "Roadmap",
    },
    {
      label: "RI AUTOMOTIVE RINASPACE",
      href: "/solutions/automotive",
      description: "Customer journeys, enquiries, service operations, inventory, and follow-ups.",
      section: "Industry RINASPACE",
      status: "Roadmap",
    },
    {
      label: "RI LANDSCAPE RINASPACE",
      href: "/solutions/landscape",
      description: "Inventory, project work, field operations, logistics, and customers.",
      section: "Industry RINASPACE",
      status: "Preview",
    },
    {
      label: "Retail",
      href: "/solutions/retail",
      description: "Catalogue, inventory, storefront, and orders.",
      section: "Industry RINASPACE",
      status: "Preview",
    },
    {
      label: "RI LOGISTICS",
      href: "/solutions/logistics",
      description: "Shipment operations, delivery orchestration, and exception control.",
      section: "Industry RINASPACE",
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
    { label: "RI LABS", href: "/customers#labs", description: "Internal labs, experiments, and learning experiences." },
  ],
};

export const NAV_PRICING: NavGroup = {
  label: "Pricing",
  href: "/pricing",
  items: [
    { label: "Plans", href: "/pricing", description: "Start, Grow, Scale, and Enterprise packaging." },
    { label: "Talk to sales", href: "/company/contact?intent=sales", description: "Discuss the right commercial path." },
  ],
};

export const NAV_SERVICES: NavGroup = {
  label: "Services",
  href: "/services",
  items: [
    { label: "Software Implementation", href: "/services#software-implementation" },
    { label: "System Integration", href: "/services#system-integration" },
    { label: "AI & Automation", href: "/services#ai-automation" },
    { label: "Migration", href: "/services#migration" },
    { label: "Business Transformation", href: "/services#business-transformation" },
    { label: "Growth Systems", href: "/services#growth-systems" },
    { label: "Creative Systems", href: "/services#creative-systems" },
    { label: "Training", href: "/services#training" },
  ],
};

export const NAV_ACADEMY: NavGroup = {
  label: "RI LABS",
  href: "/resources/academy",
  items: [
    { label: "RI LABS overview", href: "/resources/academy" },
    { label: "Programs", href: "/academy/programs" },
  ],
};

export const NAV_RESOURCES: NavGroup = {
  label: "Resources",
  href: "/resources",
  items: [
    { label: "RI LABS", href: "/resources/academy", description: "Learn, build, test, and gain operating experience with RINADS." },
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
  { label: "RINADS Intelligence", href: "/platform/intelligence" },
  { label: "RINPO Runtime", href: "/platform/rinpo-runtime" },
  { label: "RI ID + RI SPACE", href: "/platform/cloud" },
  { label: "RINPO", href: "/rinpo" },
  { label: "Pricing", href: "/pricing" },
];

export const FOOTER_SOLUTIONS: NavLink[] = [
  { label: "RI SALON RINASPACE", href: "/solutions/salon" },
  { label: "Retail", href: "/solutions/retail" },
  { label: "RI LANDSCAPE RINASPACE", href: "/solutions/landscape" },
  { label: "All Industry RINASPACES", href: "/solutions" },
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
  { label: "RI LABS", href: "/resources/academy" },
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
  automate: "Automation, orchestrated by RINPO Runtime",
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
