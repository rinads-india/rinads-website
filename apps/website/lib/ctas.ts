/**
 * Site-wide CTA taxonomy — single source of truth for marketing destinations.
 * Prefer intent-specific labels; avoid repeating "Book a platform demo" everywhere.
 *
 * createWorkspace stays disabled until production self-service onboarding is ready.
 */
export const CTAS = {
  bookDemo: { label: "Book a demo", href: "/contact?intent=demo" },
  talkSales: { label: "Talk to sales", href: "/contact?intent=sales" },
  talkImplementation: {
    label: "Talk to an implementation specialist",
    href: "/contact?intent=implementation",
  },
  exploreBusinessOs: { label: "Explore Business OS", href: "/platform/business-os" },
  explorePlatform: { label: "Explore the platform", href: "/platform" },
  exploreSolution: { label: "Explore solution", href: "/solutions" },
  seeRinpo: { label: "See how RINPO works", href: "/rinpo" },
  tryRinpo: { label: "Try RINPO", href: "/#ask-rinpo", action: "rinpo" as const },
  tryRinpoDemo: { label: "Try RINPO", action: "rinpo_demo" as const },
  pricingEstimate: {
    label: "Get my pricing estimate",
    href: "/contact?intent=sales&flow=pricing-estimate",
  },
  startProject: { label: "Start a project", href: "/projects" },
  explorePrograms: { label: "Explore programs", href: "/academy/programs" },
  readGuide: { label: "Read guide", href: "/resources" },
  /** Only surface when production self-service onboarding is ready. */
  createWorkspace: { label: "Create workspace", href: "/signup", enabled: false },
  signIn: { label: "Sign in", href: "/signup?mode=login" },
  viewPricing: { label: "View pricing", href: "/pricing" },
  viewSecurity: { label: "View Security", href: "/security" },
} as const;

export type CtaKey = keyof typeof CTAS;

/**
 * Navbar / hero / CTASection compatibility shape.
 * primary = commercial demo; secondary = product exploration; signIn = auth.
 */
export const NAV_CTAS = {
  primary: CTAS.bookDemo,
  secondary: CTAS.exploreBusinessOs,
  signIn: CTAS.signIn,
  rinpo: { label: CTAS.tryRinpo.label, action: "rinpo" as const, href: CTAS.tryRinpo.href },
} as const;
