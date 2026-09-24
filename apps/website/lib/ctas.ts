/**
 * Site-wide CTA taxonomy — single source of truth for marketing destinations.
 * Avoid vague labels like "Start", "Get started", "Explore more" unless the
 * destination is unambiguous from context.
 *
 * createWorkspace stays disabled until production self-service onboarding is ready.
 * Prefer Book a platform demo / Sign in on public marketing surfaces.
 */
export const CTAS = {
  bookDemo: { label: "Book a platform demo", href: "/contact?intent=demo" },
  talkSales: { label: "Talk to sales", href: "/contact?intent=sales" },
  talkImplementation: {
    label: "Talk to an implementation specialist",
    href: "/contact?intent=implementation",
  },
  exploreBusinessOs: { label: "Explore Business OS", href: "/platform/business-os" },
  explorePlatform: { label: "Explore the platform", href: "/platform" },
  seeRinpo: { label: "See how RINPO works", href: "/rinpo" },
  tryRinpoDemo: { label: "Try the RINPO demo", action: "rinpo_demo" as const },
  /** Only surface when production self-service onboarding is ready. */
  createWorkspace: { label: "Create workspace", href: "/signup", enabled: false },
  signIn: { label: "Sign in", href: "/signup?mode=login" },
  viewPricing: { label: "View pricing", href: "/pricing" },
  viewSecurity: { label: "View security", href: "/security" },
  startProject: { label: "Start a project conversation", href: "/projects" },
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
  rinpo: { label: CTAS.seeRinpo.label, action: "rinpo" as const },
} as const;
