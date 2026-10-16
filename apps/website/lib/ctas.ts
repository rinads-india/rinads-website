/**
 * Site-wide CTA taxonomy — single source of truth for marketing destinations.
 * Prefer intent-specific labels; avoid repeating "Book a demo" everywhere.
 *
 * createWorkspace stays disabled until production self-service onboarding is ready.
 */
export const CTAS = {
  talkToRinpo: { label: "Talk to RINPO", href: "/", action: "rinpo" as const },
  exploreRinads: { label: "Explore RINADS", href: "/platform" },
  bookDemo: { label: "Book a Demo", href: "/company/contact?intent=demo" },
  /** Alias for forms that still use contact?intent=demo on /contact. */
  bookDemoContact: { label: "Book a Demo", href: "/contact?intent=demo" },
  talkSales: { label: "Talk to sales", href: "/company/contact?intent=sales" },
  talkImplementation: {
    label: "Talk to an implementation specialist",
    href: "/company/contact?intent=implementation",
  },
  exploreBusiness: { label: "Explore Business", href: "/platform/business" },
  /** @deprecated Prefer exploreBusiness */
  exploreBusinessOs: { label: "Explore Business", href: "/platform/business" },
  explorePlatform: { label: "Explore RINADS", href: "/platform" },
  exploreSolution: { label: "Explore editions", href: "/solutions" },
  seeRinpo: { label: "See how RINPO works", href: "/rinpo" },
  tryRinpo: { label: "Talk to RINPO", href: "/", action: "rinpo" as const },
  tryRinpoDemo: { label: "Talk to RINPO", action: "rinpo_demo" as const },
  pricingEstimate: {
    label: "Get my pricing estimate",
    href: "/company/contact?intent=sales&flow=pricing-estimate",
  },
  startProject: { label: "Start a project", href: "/projects" },
  explorePrograms: { label: "Explore programs", href: "/resources/academy" },
  readGuide: { label: "Read guide", href: "/resources" },
  businessReadiness: { label: "Check business readiness", href: "/business-readiness" },
  /** Only surface when production self-service onboarding is ready. */
  createWorkspace: { label: "Create workspace", href: "/signup", enabled: false },
  signIn: { label: "Sign in", href: "/signup?mode=login" },
  viewPricing: { label: "View pricing", href: "/pricing" },
  viewSecurity: { label: "View Security", href: "/trust/security" },
  viewAvailability: { label: "View availability", href: "/trust/availability" },
} as const;

export type CtaKey = keyof typeof CTAS;

/**
 * Navbar / hero / CTASection compatibility shape.
 * primary = Book Demo; secondary = Explore RINADS; rinpo = Talk to RINPO.
 */
export const NAV_CTAS = {
  primary: CTAS.bookDemo,
  secondary: CTAS.exploreRinads,
  signIn: CTAS.signIn,
  rinpo: { label: CTAS.talkToRinpo.label, action: "rinpo" as const, href: CTAS.talkToRinpo.href },
} as const;
