export type NavLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavLink[];
};

export const PRODUCT_HIERARCHY = {
  businessOs: {
    label: "Business OS",
    href: "/business-os",
    appHref: "/os",
    description: "Run your business from one intelligent workspace.",
  },
  rinpo: {
    label: "RINPO Intelligence",
    href: "/rinpo-intelligence",
    description: "Understand your business and know what to do next.",
  },
  cloud: {
    label: "RINADS Cloud",
    href: "/cloud",
    description: "The connected platform behind RINADS.",
  },
  services: {
    label: "RINADS Services",
    href: "/services",
    description: "Build, grow, and automate with RINADS.",
  },
} as const;

export const NAV_PRODUCTS: NavGroup = {
  label: "Products",
  items: [
    { label: PRODUCT_HIERARCHY.businessOs.label, href: PRODUCT_HIERARCHY.businessOs.href },
    { label: PRODUCT_HIERARCHY.rinpo.label, href: PRODUCT_HIERARCHY.rinpo.href },
    { label: PRODUCT_HIERARCHY.cloud.label, href: PRODUCT_HIERARCHY.cloud.href },
  ],
};

export const NAV_SOLUTIONS: NavGroup = {
  label: "Solutions",
  items: [
    { label: "Custom Software", href: "/services#build" },
    { label: "Growth Marketing", href: "/grow" },
    { label: "AI Automation", href: "/services#automate" },
    { label: "Industry Solutions", href: "/#industry" },
  ],
};

export const NAV_COMPANY: NavGroup = {
  label: "Company",
  items: [
    { label: "Projects", href: "/projects" },
    { label: "Story", href: "/rinpo-story" },
    { label: "About", href: "/#about" },
    { label: "Contact", href: "/#contact" },
  ],
};

export const NAV_GROUPS: NavGroup[] = [NAV_PRODUCTS, NAV_SOLUTIONS, NAV_COMPANY];

export const FOOTER_PRODUCTS: NavLink[] = [
  { label: "Business OS", href: "/business-os" },
  { label: "RINPO Intelligence", href: "/rinpo-intelligence" },
  { label: "RINADS Cloud", href: "/cloud" },
  { label: "RINADS Services", href: "/services" },
];

export const FOOTER_COMPANY: NavLink[] = [
  { label: "Projects", href: "/projects" },
  { label: "Story", href: "/rinpo-story" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
  { label: "Business OS App", href: "/os" },
];

export const BRAND_EQUATION = {
  tagline: "Run. Understand. Automate. Grow.",
  run: "Business OS",
  understand: "RINPO Intelligence",
  automate: "Workflows",
  grow: "Marketing + Services",
} as const;
