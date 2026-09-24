export type NavStatus =
  | "Generally available"
  | "Available configuration"
  | "Private preview"
  | "Prototype / demo"
  | "Coming soon";

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
  hero: "Run your business with one AI operating platform.",
  support:
    "Connect customers, work, commerce, marketing and automation on one shared business foundation. RINPO helps your team understand what needs attention, prepare the next step and move supported actions through the right permissions and approvals.",
  closing: "One connected platform. Powered by RINPO — with human control where it matters.",
  equation: "RUN · BUILD · GROW · LEARN · AUTOMATE",
  category: "AI operating system for growing businesses",
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
    label: "Product",
    href: "/platform",
    description: "The AI operating platform for growing businesses.",
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
    description: "Context, recommendations, and governed AI behaviour.",
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
  { label: "Business OS", href: "/platform/business-os", description: "Run customers, work, money, and operations.", section: "Run", status: "Available configuration" },
  { label: "Commerce OS", href: "/platform/commerce-os", description: "Sell, transact, and fulfil.", section: "Run", status: "Available configuration" },
  { label: "Marketing OS", href: "/platform/marketing-os", description: "Plan, launch, and measure growth.", section: "Grow", status: "Prototype / demo" },
  { label: "Creative OS", href: "/platform/creative-os", description: "Create content, image, video, and film.", section: "Grow", status: "Coming soon" },
  { label: "Logistics OS", href: "/platform/logistics-os", description: "Move, track, and resolve delivery operations.", section: "Operate", status: "Prototype / demo" },
  { label: "Automation OS", href: "/platform/automation-os", description: "Connect workflows, approvals, and actions.", section: "Operate", status: "Prototype / demo" },
  { label: "Build OS", href: "/platform/build-os", description: "Turn requirements into shipped software.", section: "Build & learn", status: "Prototype / demo" },
  { label: "Academy OS", href: "/platform/academy-os", description: "Train people through real work.", section: "Build & learn", status: "Prototype / demo" },
  { label: "RINPO", href: "/rinpo", description: "The persistent AI interface across RINADS.", section: "Core", status: "Available configuration" },
  { label: "RINADS Intelligence", href: "/platform/rinads-intelligence", description: "The intelligence layer behind the platform.", section: "Core", status: "Available configuration" },
  { label: "RINADS Cloud", href: "/platform/rinads-cloud", description: "The connected platform foundation.", section: "Core", status: "Available configuration" },
];

export const NAV_PRODUCT: NavGroup = {
  label: "Product",
  href: "/platform",
  items: PLATFORM_OS,
  variant: "mega",
};

/** @deprecated Prefer NAV_PRODUCT */
export const NAV_PLATFORM = NAV_PRODUCT;

export const NAV_SOLUTIONS: NavGroup = {
  label: "Solutions",
  href: "/solutions",
  variant: "mega",
  items: [
    {
      label: "Retail",
      href: "/solutions/retail",
      description: "Catalogue, inventory, storefront, orders, and customer growth.",
      section: "Commercial",
      status: "Prototype / demo",
    },
    {
      label: "Landscape & Nursery",
      href: "/solutions/nursery",
      description: "Inventory, project work, field operations, and customer management.",
      section: "Commercial",
      status: "Prototype / demo",
    },
    {
      label: "Salon / R GLOW",
      href: "/solutions/salon",
      description: "Appointments, clients, services, loyalty, and campaigns.",
      section: "Commercial",
      status: "Available configuration",
    },
    {
      label: "Jewellery",
      href: "/solutions/jewellery",
      description: "Collections, product studio, appointments, CRM, and brand content.",
      section: "Future / private preview",
      status: "Coming soon",
    },
    {
      label: "Logistics",
      href: "/solutions/logistics",
      description: "Provider-neutral shipment operations and exception control.",
      section: "Future / private preview",
      status: "Coming soon",
    },
    {
      label: "Healthcare",
      href: "/solutions/healthcare",
      description: "Scheduling, patient flow, follow-ups, team work, and analytics.",
      section: "Future / private preview",
      status: "Private preview",
    },
  ],
};

export const NAV_CUSTOMERS: NavGroup = {
  label: "Customers",
  href: "/customers",
  items: [
    { label: "Customer stories", href: "/customers", description: "How organisations use RINADS." },
    { label: "Book a platform demo", href: "/contact?intent=demo", description: "See the platform with your workflow in mind." },
  ],
};

export const NAV_PRICING: NavGroup = {
  label: "Pricing",
  href: "/pricing",
  items: [
    { label: "Plans", href: "/pricing", description: "Start, Grow, Scale, and Enterprise packaging." },
    { label: "Talk to sales", href: "/contact?intent=sales", description: "Discuss the right commercial path." },
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
    { label: "Documentation", href: "/docs", description: "Platform documentation foundation." },
    { label: "Developers", href: "/developers", description: "APIs, auth, webhooks, and events." },
    { label: "Integrations", href: "/integrations", description: "Connect tools with explicit availability." },
    { label: "Security", href: "/security", description: "AI inside business controls." },
    { label: "Changelog", href: "/changelog", description: "Product updates." },
    { label: "Start a Project", href: "/projects", description: "Tell RINADS what you need to accomplish." },
  ],
};

export const NAV_COMPANY: NavGroup = {
  label: "Company",
  href: "/about",
  items: [
    { label: "About", href: "/about" },
    { label: "Company", href: "/company" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
    { label: "Status", href: "/status" },
    { label: "RINPO story", href: "/company/rinpo-story" },
  ],
};

/** Primary marketing navigation — RINPO lives inside Product, not as a top-level item. */
export const NAV_GROUPS: NavGroup[] = [
  NAV_PRODUCT,
  NAV_SOLUTIONS,
  NAV_CUSTOMERS,
  NAV_PRICING,
  NAV_RESOURCES,
  NAV_SERVICES,
  NAV_ACADEMY,
];

export const FOOTER_PLATFORM: NavLink[] = [
  { label: "Platform Overview", href: "/platform" },
  { label: "Business OS", href: "/platform/business-os" },
  { label: "Commerce OS", href: "/platform/commerce-os" },
  { label: "RINADS Intelligence", href: "/platform/rinads-intelligence" },
  { label: "RINADS Cloud", href: "/platform/rinads-cloud" },
  { label: "RINPO", href: "/rinpo" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security", href: "/security" },
];

export const FOOTER_COMPANY: NavLink[] = [
  { label: "About", href: "/about" },
  { label: "Customers", href: "/customers" },
  { label: "Contact", href: "/contact" },
  { label: "Careers", href: "/careers" },
  { label: "Academy", href: "/academy" },
  { label: "Services", href: "/services" },
  { label: "Solutions", href: "/solutions" },
  { label: "Resources", href: "/resources" },
  { label: "Developers", href: "/developers" },
  { label: "Status", href: "/status" },
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
  run: "Business OS",
  build: "Build OS",
  grow: "Marketing OS + Services",
  learn: "Academy OS",
  automate: "Automation OS, orchestrated by RINPO",
} as const;

export const HERO_COMMANDS = [
  "What's happening in my business?",
  "Find what needs attention",
  "Build something",
  "Automate a workflow",
] as const;

/** Navbar utility CTAs — prefer commercial clarity over vague “Start”. */
export const CTAS = {
  primary: { label: "Book a platform demo", href: "/contact?intent=demo" },
  secondary: { label: "Explore Business OS", href: "/platform/business-os" },
  signIn: { label: "Sign in", href: "/signup?mode=login" },
  rinpo: { label: "See how RINPO works", action: "rinpo" as const },
} as const;
