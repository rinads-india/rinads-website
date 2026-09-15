import type { OsPageContent } from "./types";

export const PLATFORM_OVERVIEW = {
  eyebrow: "RINADS Platform",
  headline: "The AI Operating Platform for Business.",
  summary:
    "One intelligent ecosystem to run, build, grow, learn, and automate — with RINPO as the interface and RINADS Intelligence as the brain.",
};

export const OS_PAGES: Record<string, OsPageContent> = {
  "business-os": {
    slug: "business-os",
    name: "Business OS",
    eyebrow: "Business OS",
    headline: "Run your business from one intelligent workspace.",
    summary:
      "Customers, work, money, growth, automation, and intelligence — connected as one operating system, not a pile of apps.",
    modules: [
      { name: "Customers", description: "Leads, clients, CRM, and follow-ups." },
      { name: "Work", description: "Projects, tasks, calendar, and team." },
      { name: "Money", description: "Invoices, payments, expenses, and reports." },
      { name: "Growth", description: "Marketing, campaigns, analytics, and SEO." },
      { name: "Automation", description: "Workflows, integrations, and scheduled actions." },
      { name: "Intelligence", description: "RINPO insights, recommendations, and next actions." },
    ],
    related: [
      { label: "Commerce OS", href: "/platform/commerce-os" },
      { label: "Automation OS", href: "/platform/automation-os" },
      { label: "Open Business OS", href: "/os" },
    ],
  },
  "commerce-os": {
    slug: "commerce-os",
    name: "Commerce OS",
    eyebrow: "Commerce OS",
    headline: "Sell, fulfill, and grow commerce with AI.",
    summary:
      "Products, catalogue, inventory, storefront, orders, and payments — unified with AI commerce assistants.",
    modules: [
      { name: "Products" },
      { name: "Catalogue" },
      { name: "Collections" },
      { name: "Inventory" },
      { name: "Storefront" },
      { name: "CMS" },
      { name: "Orders" },
      { name: "Payments" },
      { name: "Customers" },
      { name: "Promotions" },
      { name: "AI Commerce" },
    ],
    related: [
      { label: "Logistics OS", href: "/platform/logistics-os" },
      { label: "Marketing OS", href: "/platform/marketing-os" },
    ],
  },
  "marketing-os": {
    slug: "marketing-os",
    name: "Marketing OS",
    eyebrow: "Marketing OS",
    headline: "Grow your brand across every channel.",
    summary:
      "Content, campaigns, Meta, Google, SEO, WhatsApp, email, analytics, and CRM — orchestrated as one growth system.",
    modules: [
      { name: "Content" },
      { name: "Campaigns" },
      { name: "Meta" },
      { name: "Google" },
      { name: "SEO" },
      { name: "WhatsApp" },
      { name: "Email" },
      { name: "Analytics" },
      { name: "CRM" },
    ],
    related: [
      { label: "Creative OS", href: "/platform/creative-os" },
      { label: "Marketing Services", href: "/services/marketing" },
    ],
  },
  "logistics-os": {
    slug: "logistics-os",
    name: "Logistics OS",
    eyebrow: "Logistics OS",
    headline: "Control tower for movement and delivery.",
    summary:
      "Orders, shipments, couriers, 3PL, tracking, returns, and exceptions — provider-neutral architecture for real operations.",
    modules: [
      { name: "Orders" },
      { name: "Shipments" },
      { name: "Parcel" },
      { name: "Courier" },
      { name: "Porter" },
      { name: "3PL" },
      { name: "Tracking" },
      { name: "Delivery" },
      { name: "Returns" },
      { name: "Exceptions" },
      { name: "Control Tower" },
    ],
    related: [
      { label: "Commerce OS", href: "/platform/commerce-os" },
      { label: "Logistics Solutions", href: "/solutions/logistics" },
    ],
  },
  "creative-os": {
    slug: "creative-os",
    name: "Creative OS",
    eyebrow: "Creative OS",
    headline: "Create with AI — image, video, film, and brand.",
    summary:
      "From product studio to story studio — generate, refine, and ship creative work inside the RINADS platform.",
    modules: [
      { name: "AI Image" },
      { name: "AI Video" },
      { name: "AI Film" },
      { name: "Product Studio" },
      { name: "Creator OS" },
      { name: "Brand OS" },
      { name: "Story Studio" },
      { name: "Script Studio" },
      { name: "Voice" },
      { name: "Music" },
      { name: "SFX" },
    ],
    related: [
      { label: "Creative Services", href: "/services/creative" },
      { label: "AI Filmmaking Academy", href: "/academy/filmmaking" },
    ],
  },
  "build-os": {
    slug: "build-os",
    name: "Build OS",
    eyebrow: "Build OS",
    headline: "Software factory from discovery to monitoring.",
    summary:
      "PRD, UX, architecture, database, frontend, backend, AI, testing, GitHub, deployment, and monitoring — one build system.",
    modules: [
      { name: "Discovery" },
      { name: "PRD" },
      { name: "UX" },
      { name: "Architecture" },
      { name: "Database" },
      { name: "Frontend" },
      { name: "Backend" },
      { name: "AI" },
      { name: "Testing" },
      { name: "GitHub" },
      { name: "Deployment" },
      { name: "Monitoring" },
    ],
    related: [
      { label: "Software Services", href: "/services/software" },
      { label: "Software School", href: "/academy/software" },
    ],
  },
  "academy-os": {
    slug: "academy-os",
    name: "Academy OS",
    eyebrow: "Academy OS",
    headline: "Real Experience Academy inside the platform.",
    summary:
      "Learn → Practice → Work → Ship → Measure → Improve → Certify — with RINPO as tutor across online, offline, and hybrid.",
    modules: [
      { name: "RINADS University" },
      { name: "Founder School" },
      { name: "AI School" },
      { name: "AI Filmmaking" },
      { name: "Creator School" },
      { name: "Software School" },
      { name: "Marketing School" },
      { name: "Automation School" },
      { name: "Commerce School" },
      { name: "Logistics School" },
    ],
    related: [
      { label: "Academy Hub", href: "/academy" },
      { label: "Training Services", href: "/services/training" },
    ],
  },
  "automation-os": {
    slug: "automation-os",
    name: "Automation OS",
    eyebrow: "Automation OS",
    headline: "Automate operations with workflows and agents.",
    summary:
      "Workflows and triggers, carried out by RINPO — so routine work becomes reliable system behavior.",
    modules: [
      { name: "Workflows", description: "Design and run multi-step business processes." },
      { name: "Triggers", description: "Events, schedules, and conditions." },
      { name: "Integrations", description: "Connect tools across the stack." },
      { name: "Automated Execution", description: "RINPO carries out routine work safely." },
      { name: "Approvals", description: "Human-in-the-loop before execute." },
      { name: "Notifications", description: "Keep teams informed." },
      { name: "Audit", description: "Trace every automated action." },
    ],
    related: [
      { label: "RINADS Intelligence", href: "/platform/rinads-intelligence" },
      { label: "Automation Services", href: "/services/automation" },
    ],
  },
  "rinads-intelligence": {
    slug: "rinads-intelligence",
    name: "RINADS Intelligence",
    eyebrow: "RINADS Intelligence",
    headline: "The brain of the operating platform.",
    summary:
      "RINADS Intelligence understands your business, remembers what matters, and recommends what to do next — with every action audited and permission-checked.",
    modules: [
      { name: "Understands your business", description: "Customers, work, money, and activity, connected." },
      { name: "Remembers what matters", description: "Context that persists across people and work." },
      { name: "Recommends what to do next", description: "Clear, useful suggestions from real signals." },
      { name: "Connects insight to action", description: "Turns understanding into workflow." },
      { name: "Respects permissions", description: "Every action honors who can see and do what." },
      { name: "Keeps a full audit trail", description: "Every AI-assisted action is traceable." },
    ],
    related: [
      { label: "RINPO", href: "/rinpo" },
      { label: "RINADS Cloud", href: "/platform/rinads-cloud" },
    ],
  },
  "rinads-cloud": {
    slug: "rinads-cloud",
    name: "RINADS Cloud",
    eyebrow: "RINADS Cloud",
    headline: "The foundation behind every OS.",
    summary:
      "Data, AI, APIs, integrations, events, storage, security, automation, and infrastructure — one cloud for the platform.",
    modules: [
      { name: "Data" },
      { name: "AI" },
      { name: "APIs" },
      { name: "Integrations" },
      { name: "Events" },
      { name: "Storage" },
      { name: "Security" },
      { name: "Automation" },
      { name: "Infrastructure" },
    ],
    related: [
      { label: "RINADS Intelligence", href: "/platform/rinads-intelligence" },
      { label: "Platform Overview", href: "/platform" },
    ],
  },
};

export function getOsPage(slug: string): OsPageContent | null {
  return OS_PAGES[slug] ?? null;
}

export const OS_SLUGS = Object.keys(OS_PAGES);
