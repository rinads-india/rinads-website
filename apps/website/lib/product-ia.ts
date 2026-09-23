export type NavStatus = "Available" | "Coming soon";

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
  hero: "The AI Operating Platform for Business.",
  support:
    "Run your business. Build your software. Grow your brand. Automate your operations. Train your people.",
  closing: "One intelligent platform. Powered by RINPO.",
  equation: "RUN · BUILD · GROW · LEARN · AUTOMATE",
} as const;

/**
 * Public-facing architecture, intentionally collapsed. RINPO's runtime and
 * RINADS Intelligence internals are founder/staff-only concepts — the
 * public site describes what RINPO does, not how it is built underneath.
 */
export const ARCHITECTURE_LAYERS = [
  { id: "experience", label: "RINADS Experience", description: "The front door to the platform." },
  { id: "rinpo", label: "RINPO", description: "Your AI interface — understands your business and gets things done." },
  {
    id: "os",
    label: "Operating Systems",
    description: "Business, Commerce, Marketing, Logistics, Creative, Build, Academy, Automation.",
  },
  { id: "services", label: "RINADS Services", description: "Build, grow, create, transform, train." },
  { id: "cloud", label: "RINADS Cloud", description: "Data, AI, APIs, and infrastructure." },
] as const;

export const PRODUCT_HIERARCHY = {
  platform: {
    label: "Platform",
    href: "/platform",
    description: "The AI Operating Platform for Business.",
  },
  businessOs: {
    label: "Business OS",
    href: "/platform/business-os",
    appHref: "/os",
    description: "Run customers, work, money, growth, and automation.",
  },
  rinpo: {
    label: "RINPO",
    href: "/rinpo",
    description: "The persistent AI interface for business.",
  },
  intelligence: {
    label: "RINADS Intelligence",
    href: "/platform/rinads-intelligence",
    description: "The brain — graphs, memory, decisions, and agents.",
  },
  cloud: {
    label: "RINADS Cloud",
    href: "/platform/rinads-cloud",
    description: "The connected platform behind RINADS.",
  },
  academy: {
    label: "Academy",
    href: "/academy",
    description: "Real Experience Academy — learn, practice, ship, certify.",
  },
  services: {
    label: "RINADS Services",
    href: "/services",
    description: "Build, grow, automate, create, transform, and train.",
  },
} as const;

export const PLATFORM_OS: NavLink[] = [
  { label: "Business OS", href: "/platform/business-os", description: "Run customers, work, money, and operations.", section: "Run" },
  { label: "Commerce OS", href: "/platform/commerce-os", description: "Sell, transact, and fulfil.", section: "Run" },
  { label: "Marketing OS", href: "/platform/marketing-os", description: "Plan, launch, and measure growth.", section: "Grow" },
  { label: "Creative OS", href: "/platform/creative-os", description: "Create content, image, video, and film.", section: "Grow" },
  { label: "Logistics OS", href: "/platform/logistics-os", description: "Move, track, and resolve delivery operations.", section: "Operate" },
  { label: "Automation OS", href: "/platform/automation-os", description: "Connect workflows, approvals, and actions.", section: "Operate" },
  { label: "Build OS", href: "/platform/build-os", description: "Turn requirements into shipped software.", section: "Build & learn" },
  { label: "Academy OS", href: "/platform/academy-os", description: "Train people through real work.", section: "Build & learn" },
  { label: "RINADS Intelligence", href: "/platform/rinads-intelligence", description: "The intelligence layer behind the platform.", section: "Core" },
  { label: "RINADS Cloud", href: "/platform/rinads-cloud", description: "The connected platform foundation.", section: "Core" },
];

export const NAV_PLATFORM: NavGroup = {
  label: "Platform",
  href: "/platform",
  items: PLATFORM_OS,
  variant: "mega",
};

export const NAV_SOLUTIONS: NavGroup = {
  label: "Solutions",
  href: "/solutions",
  variant: "mega",
  items: [
    {
      label: "Retail",
      href: "/solutions/retail",
      description: "Catalogue, inventory, storefront, orders, and customer growth.",
      section: "Available",
      status: "Available",
    },
    {
      label: "Landscape & Nursery",
      href: "/solutions/nursery",
      description: "Inventory, project work, field operations, and customer management.",
      section: "Available",
      status: "Available",
    },
    {
      label: "Salon / R GLOW",
      href: "/solutions/salon",
      description: "Appointments, clients, services, loyalty, and campaigns.",
      section: "Available",
      status: "Available",
    },
    {
      label: "Jewellery",
      href: "/solutions/jewellery",
      description: "Collections, product studio, appointments, CRM, and brand content.",
      section: "Coming soon",
      status: "Coming soon",
    },
    {
      label: "Logistics",
      href: "/solutions/logistics",
      description: "Provider-neutral shipment operations and exception control.",
      section: "Coming soon",
      status: "Coming soon",
    },
    {
      label: "Healthcare",
      href: "/solutions/healthcare",
      description: "Scheduling, patient flow, follow-ups, team work, and analytics.",
      section: "Coming soon",
      status: "Coming soon",
    },
  ],
};

export const NAV_RINPO: NavGroup = {
  label: "RINPO",
  href: "/rinpo",
  items: [
    { label: "Overview", href: "/rinpo", description: "Meet the persistent AI interface for RINADS." },
    { label: "Intelligence", href: "/rinpo/intelligence", description: "See how RINPO understands and assists." },
    { label: "Story", href: "/rinpo/story", description: "Explore RINPO's origin and identity." },
    { label: "Voice", href: "/rinpo/voice", description: "Speak to RINPO." },
    { label: "Phone", href: "/rinpo/phone", description: "AI-assisted business calling." },
  ],
};

export const NAV_SERVICES: NavGroup = {
  label: "Services",
  href: "/services",
  items: [
    { label: "Software", href: "/services/software", description: "Custom software and business systems." },
    { label: "Marketing", href: "/services/marketing", description: "Strategy, campaigns, content, and growth." },
    { label: "Intelligence & AI", href: "/services/ai", description: "AI assistants, agents, and RINPO-led experiences." },
    { label: "Automation", href: "/services/automation", description: "Workflows and integrations." },
    { label: "Creative", href: "/services/creative", description: "Creative production and media." },
    { label: "Transformation", href: "/services/transformation", description: "Operating-model and system transformation." },
    { label: "Training", href: "/services/training", description: "Team enablement and capability building." },
  ],
};

export const NAV_ACADEMY: NavGroup = {
  label: "Academy",
  href: "/academy",
  items: [
    { label: "RINADS University", href: "/academy/university" },
    { label: "Programs", href: "/academy/programs" },
    { label: "Live Classes", href: "/academy/live" },
    { label: "AI School", href: "/academy/ai" },
    { label: "AI Filmmaking", href: "/academy/filmmaking" },
    { label: "Founder School", href: "/academy/founder" },
    { label: "Software School", href: "/academy/software" },
    { label: "Marketing School", href: "/academy/marketing" },
    { label: "Creator School", href: "/academy/creator" },
  ],
};

export const NAV_RESOURCES: NavGroup = {
  label: "Resources",
  href: "/resources",
  items: [
    { label: "Resources Hub", href: "/resources", description: "Guides and product resources." },
    { label: "Start a Project", href: "/projects", description: "Tell RINADS what you need to accomplish." },
    { label: "Platform Architecture", href: "/platform", description: "Understand how the platform fits together." },
    { label: "RINADS Intelligence", href: "/platform/rinads-intelligence", description: "Explore the intelligence layer." },
    { label: "Company", href: "/company", description: "About RINADS and how to contact the team." },
  ],
};

export const NAV_COMPANY: NavGroup = {
  label: "Company",
  href: "/company",
  items: [
    { label: "About", href: "/company" },
    { label: "Projects", href: "/projects" },
    { label: "Contact", href: "/company#contact" },
    { label: "Open RINADS", href: "/os" },
  ],
};

export const NAV_GROUPS: NavGroup[] = [
  NAV_PLATFORM,
  NAV_SOLUTIONS,
  NAV_RINPO,
  NAV_SERVICES,
  NAV_ACADEMY,
  NAV_RESOURCES,
];

export const FOOTER_PLATFORM: NavLink[] = [
  { label: "Platform Overview", href: "/platform" },
  { label: "Business OS", href: "/platform/business-os" },
  { label: "Commerce OS", href: "/platform/commerce-os" },
  { label: "RINADS Intelligence", href: "/platform/rinads-intelligence" },
  { label: "RINADS Cloud", href: "/platform/rinads-cloud" },
  { label: "RINPO", href: "/rinpo" },
];

export const FOOTER_COMPANY: NavLink[] = [
  { label: "Company", href: "/company" },
  { label: "Academy", href: "/academy" },
  { label: "Services", href: "/services" },
  { label: "Solutions", href: "/solutions" },
  { label: "Projects", href: "/projects" },
  { label: "Resources", href: "/resources" },
  { label: "Open RINADS", href: "/os" },
];

export const FOOTER_LEGAL: NavLink[] = [
  { label: "Privacy Policy", href: "/company/privacy" },
  { label: "Terms of Service", href: "/company/terms" },
  { label: "Cookie Policy", href: "/company/cookies" },
];

/** @deprecated Prefer FOOTER_PLATFORM */
export const FOOTER_PRODUCTS = FOOTER_PLATFORM;

export const BRAND_EQUATION = {
  tagline: POSITIONING.equation,
  run: "Business OS",
  build: "Build OS",
  grow: "Marketing OS + Services",
  learn: "Academy OS",
  automate: "Automation OS, orchestrated by RINPO",
} as const;

export const HERO_COMMANDS = [
  "What's happening today?",
  "Build my website",
  "Launch my campaign",
  "Find my best leads",
  "Track my orders",
  "Call my logistics manager",
  "Create an AI film",
  "Train my team",
  "Build a software product",
] as const;

export const CTAS = {
  primary: { label: "Talk to RINPO", action: "rinpo" as const },
  secondary: { label: "Start with RINADS", href: "/signup" },
} as const;
