export type NavLink = {
  label: string;
  href: string;
  external?: boolean;
  description?: string;
};

export type NavGroup = {
  label: string;
  href?: string;
  items: NavLink[];
};

export const POSITIONING = {
  hero: "The AI Operating Platform for Business.",
  support:
    "Run your business. Build your software. Grow your brand. Automate your operations. Train your people.",
  closing: "One intelligent platform. Powered by RINPO.",
  equation: "RUN · BUILD · GROW · LEARN · AUTOMATE",
} as const;

export const ARCHITECTURE_LAYERS = [
  { id: "experience", label: "RINADS Experience", description: "The front door to the platform." },
  { id: "rinpo", label: "RINPO", description: "Persistent AI interface." },
  { id: "runtime", label: "RINPO Runtime", description: "Agentic execution layer." },
  { id: "intelligence", label: "RINADS Intelligence", description: "Data, decisions, and action." },
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
  { label: "Business OS", href: "/platform/business-os", description: "Run the business." },
  { label: "Commerce OS", href: "/platform/commerce-os", description: "Sell and fulfill." },
  { label: "Marketing OS", href: "/platform/marketing-os", description: "Grow the brand." },
  { label: "Logistics OS", href: "/platform/logistics-os", description: "Move and deliver." },
  { label: "Creative OS", href: "/platform/creative-os", description: "Create with AI." },
  { label: "Build OS", href: "/platform/build-os", description: "Ship software." },
  { label: "Academy OS", href: "/platform/academy-os", description: "Train people." },
  { label: "Automation OS", href: "/platform/automation-os", description: "Automate operations." },
  { label: "RINADS Intelligence", href: "/platform/rinads-intelligence", description: "The brain." },
  { label: "RINADS Cloud", href: "/platform/rinads-cloud", description: "The foundation." },
];

export const NAV_PLATFORM: NavGroup = {
  label: "Platform",
  href: "/platform",
  items: PLATFORM_OS,
};

export const NAV_SOLUTIONS: NavGroup = {
  label: "Solutions",
  href: "/solutions",
  items: [
    { label: "Retail", href: "/solutions/retail" },
    { label: "Jewellery", href: "/solutions/jewellery" },
    { label: "Nursery", href: "/solutions/nursery" },
    { label: "Salon", href: "/solutions/salon" },
    { label: "Healthcare", href: "/solutions/healthcare" },
    { label: "Logistics", href: "/solutions/logistics" },
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

export const NAV_SERVICES: NavGroup = {
  label: "Services",
  href: "/services",
  items: [
    { label: "Software", href: "/services/software" },
    { label: "Marketing", href: "/services/marketing" },
    { label: "AI", href: "/services/ai" },
    { label: "Creative", href: "/services/creative" },
    { label: "Automation", href: "/services/automation" },
    { label: "Transformation", href: "/services/transformation" },
    { label: "Training", href: "/services/training" },
  ],
};

export const NAV_RINPO: NavGroup = {
  label: "RINPO",
  href: "/rinpo",
  items: [
    { label: "Overview", href: "/rinpo" },
    { label: "Intelligence", href: "/rinpo/intelligence" },
    { label: "Story", href: "/rinpo/story" },
    { label: "Voice", href: "/rinpo/voice" },
    { label: "Phone", href: "/rinpo/phone" },
  ],
};

export const NAV_RESOURCES: NavGroup = {
  label: "Resources",
  href: "/resources",
  items: [
    { label: "Resources Hub", href: "/resources" },
    { label: "Platform Architecture", href: "/platform" },
    { label: "RINADS Intelligence", href: "/platform/rinads-intelligence" },
    { label: "Start a Project", href: "/projects" },
  ],
};

export const NAV_COMPANY: NavGroup = {
  label: "Company",
  href: "/company",
  items: [
    { label: "About", href: "/company" },
    { label: "Projects", href: "/projects" },
    { label: "Contact", href: "/company#contact" },
    { label: "Business OS App", href: "/os" },
  ],
};

export const NAV_GROUPS: NavGroup[] = [
  NAV_PLATFORM,
  NAV_SOLUTIONS,
  NAV_ACADEMY,
  NAV_SERVICES,
  NAV_RINPO,
  NAV_RESOURCES,
  NAV_COMPANY,
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
  { label: "Business OS App", href: "/os" },
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
  automate: "Automation OS + RINPO Runtime",
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
