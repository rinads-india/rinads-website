/**
 * Site-wide CTA taxonomy — Brand & Social System v1.0 §15 only.
 * Labels must match the locked library. Destinations must already exist.
 *
 * createWorkspace / startWorkspace stay disabled until production
 * self-service onboarding is ready. Do not invent destinations.
 */
export const CTAS = {
  exploreRinads: { label: "Explore RINADS", href: "/platform" },
  meetRinpo: { label: "Meet RINPO", href: "/rinpo" },
  seeHowItWorks: { label: "See how it works", href: "/platform" },
  bookDemo: { label: "Book a demo", href: "/company/contact?intent=demo" },
  /** Alias for forms that still use contact?intent=demo on /contact. */
  bookDemoContact: { label: "Book a demo", href: "/contact?intent=demo" },
  tryRinpo: { label: "Try RINPO", href: "/", action: "rinpo" as const },
  tryRinpoDemo: { label: "Try RINPO", action: "rinpo_demo" as const },
  startSelling: { label: "Start selling", href: "/platform/commerce" },
  connectYourStore: { label: "Connect your store", href: "/solutions/retail" },
  connectYourBusiness: { label: "Connect your business", href: "/company/contact?intent=demo" },
  activateRinaspace: { label: "Activate your RINASPACE", href: "/rinaspace" },
  buildWithRi: { label: "Build with RI", href: "/resources/developers" },
  exploreApi: { label: "Explore the API", href: "/developers/api" },
  connectWithMcp: { label: "Connect with MCP", href: "/developers" },
  /** @deprecated Prefer meetRinpo or tryRinpo — library wording. */
  talkToRinpo: { label: "Meet RINPO", href: "/rinpo" },
  /** @deprecated Prefer bookDemo / connectYourBusiness. */
  talkSales: { label: "Book a demo", href: "/company/contact?intent=sales" },
  /** @deprecated Prefer connectYourBusiness. */
  talkImplementation: {
    label: "Connect your business",
    href: "/company/contact?intent=implementation",
  },
  exploreBusiness: { label: "Explore RINADS", href: "/platform/business" },
  /** @deprecated Prefer exploreBusiness */
  exploreBusinessOs: { label: "Explore RINADS", href: "/platform/business" },
  explorePlatform: { label: "Explore RINADS", href: "/platform" },
  exploreSolution: { label: "Activate your RINASPACE", href: "/rinaspace" },
  seeRinpo: { label: "Meet RINPO", href: "/rinpo" },
  pricingEstimate: {
    label: "Book a demo",
    href: "/company/contact?intent=sales&flow=pricing-estimate",
  },
  startProject: { label: "Connect your business", href: "/projects" },
  explorePrograms: { label: "See how it works", href: "/labs" },
  readGuide: { label: "See how it works", href: "/resources" },
  /** Named assessment link — not a campaign CTA. */
  businessReadiness: { label: "Check business readiness", href: "/business-readiness" },
  /** Only surface when production self-service onboarding is ready. */
  createWorkspace: { label: "Start your workspace", href: "/signup", enabled: false },
  signIn: { label: "Sign in", href: "/signup?mode=login" },
  viewPricing: { label: "View pricing", href: "/pricing" },
  viewSecurity: { label: "View Security", href: "/trust/security" },
  viewAvailability: { label: "View availability", href: "/trust/availability" },
} as const;

export type CtaKey = keyof typeof CTAS;

/**
 * Navbar / hero / CTASection compatibility shape.
 * primary = Book a demo; secondary = Explore RINADS; rinpo = Meet RINPO.
 */
export const NAV_CTAS = {
  primary: CTAS.bookDemo,
  secondary: CTAS.exploreRinads,
  signIn: CTAS.signIn,
  rinpo: { label: CTAS.meetRinpo.label, action: "rinpo" as const, href: CTAS.meetRinpo.href },
} as const;
