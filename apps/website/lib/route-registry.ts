/**
 * Central route registry for marketing SEO.
 * Auth/app routes are listed as non-indexable so they never enter the sitemap.
 */

export type PageType =
  | "home"
  | "product"
  | "solution"
  | "customer"
  | "pricing"
  | "security"
  | "resource"
  | "docs"
  | "developers"
  | "company"
  | "legal"
  | "form"
  | "auth"
  | "app"
  | "utility";

export type SchemaType =
  | "Organization"
  | "WebSite"
  | "WebPage"
  | "BreadcrumbList"
  | "SoftwareApplication"
  | "Service"
  | "Course"
  | "Article"
  | "JobPosting"
  | "FAQPage";

export type RouteDefinition = {
  path: string;
  indexable: boolean;
  canonical?: string;
  title: string;
  description: string;
  pageType: PageType;
  schemaTypes?: SchemaType[];
  ogImage?: string;
};

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rinads.com";

export const ROUTE_REGISTRY: RouteDefinition[] = [
  {
    path: "/",
    indexable: true,
    title: "RINADS | Business Intelligence Infrastructure",
    description:
      "Business Intelligence Infrastructure for Software-Defined Business. Powered by RINADS INTELLIGENCE. Executed by RINPO RUNTIME.",
    pageType: "home",
    schemaTypes: ["Organization", "WebSite", "SoftwareApplication"],
  },
  {
    path: "/platform",
    indexable: true,
    title: "RINADS Platform | Business Intelligence Infrastructure",
    description:
      "RINADS → RINADS INTELLIGENCE → RINPO RUNTIME → RI ID + RI SPACE → Industry RINASPACES → Connectors, Automations, Marketplace and RI LABS.",
    pageType: "product",
  },
  {
    path: "/platform/business",
    indexable: true,
    title: "Business | RINADS Platform",
    description: "Customers, CRM, projects, finance, and people on the shared RINADS operating core.",
    pageType: "product",
  },
  {
    path: "/platform/commerce",
    indexable: true,
    title: "Commerce | RINADS Platform",
    description: "Products, orders, payments, and fulfilment connected to Business and Growth.",
    pageType: "product",
  },
  {
    path: "/platform/growth",
    indexable: true,
    title: "Growth | RINADS Platform",
    description: "Leads, marketing, content, and campaigns on the shared platform foundation.",
    pageType: "product",
  },
  {
    path: "/platform/automation",
    indexable: true,
    title: "Automation | RINADS Platform",
    description: "Workflows, agents, approvals, and integrations with human control where it matters.",
    pageType: "product",
  },
  {
    path: "/platform/intelligence",
    indexable: true,
    title: "RINADS INTELLIGENCE | Governed Intelligence for Business",
    description:
      "Understand, reason, recommend, and orchestrate — with replaceable providers inside organisation permissions.",
    pageType: "product",
  },
  {
    path: "/platform/rinpo-runtime",
    indexable: true,
    title: "RINPO RUNTIME | Governed Execution",
    description:
      "Agents, tools, workflows, triggers, permissions, approvals, execution, and audit behind RINPO.",
    pageType: "product",
  },
  {
    path: "/platform/cloud",
    indexable: true,
    title: "RINADS Platform | Shared Foundation",
    description: "Identity, organisation context, data, APIs, events, and infrastructure behind RINADS.",
    pageType: "product",
  },
  {
    path: "/platform/business-os",
    indexable: false,
    canonical: "/platform/business",
    title: "Business (legacy path) | RINADS",
    description: "Redirects to the Business platform pillar.",
    pageType: "product",
  },
  {
    path: "/platform/commerce-os",
    indexable: false,
    canonical: "/platform/commerce",
    title: "Commerce (legacy path) | RINADS",
    description: "Redirects to the Commerce platform pillar.",
    pageType: "product",
  },
  {
    path: "/platform/marketing-os",
    indexable: false,
    canonical: "/platform/growth",
    title: "Marketing (legacy path) | RINADS",
    description: "Redirects to the Growth platform pillar.",
    pageType: "product",
  },
  {
    path: "/platform/creative-os",
    indexable: false,
    canonical: "/platform/growth",
    title: "Creative (legacy path) | RINADS",
    description: "Redirects to the Growth platform pillar.",
    pageType: "product",
  },
  {
    path: "/platform/logistics-os",
    indexable: false,
    canonical: "/platform/automation",
    title: "Logistics (legacy path) | RINADS",
    description: "Redirects to the Automation platform pillar.",
    pageType: "product",
  },
  {
    path: "/platform/automation-os",
    indexable: false,
    canonical: "/platform/automation",
    title: "Automation (legacy path) | RINADS",
    description: "Redirects to the Automation platform pillar.",
    pageType: "product",
  },
  {
    path: "/platform/build-os",
    indexable: false,
    canonical: "/platform/business",
    title: "Build (legacy path) | RINADS",
    description: "Redirects to the Business platform pillar.",
    pageType: "product",
  },
  {
    path: "/platform/academy-os",
    indexable: false,
    canonical: "/labs",
    title: "Academy OS (legacy path) | RINADS",
    description: "Redirects to RI LABS.",
    pageType: "product",
  },
  {
    path: "/platform/rinads-intelligence",
    indexable: false,
    canonical: "/platform/intelligence",
    title: "RINADS Intelligence (legacy path)",
    description: "Redirects to /platform/intelligence.",
    pageType: "product",
  },
  {
    path: "/platform/rinads-cloud",
    indexable: false,
    canonical: "/platform/cloud",
    title: "RINADS Cloud (legacy path)",
    description: "Redirects to RINADS Platform at /platform/cloud.",
    pageType: "product",
  },
  {
    path: "/rinpo",
    indexable: true,
    title: "RINPO | Business Intelligence Interface for RINADS",
    description:
      "Ask, understand, recommend, prepare actions, request approval, and execute only supported actions through RINPO RUNTIME.",
    pageType: "product",
    schemaTypes: ["SoftwareApplication"],
  },
  {
    path: "/rinpo/intelligence",
    indexable: true,
    title: "RINPO Intelligence | RINADS",
    description: "See how RINPO understands business context and prepares the next supported step.",
    pageType: "product",
  },
  {
    path: "/rinpo/story",
    indexable: false,
    canonical: "/company/rinpo-story",
    title: "RINPO Story | Origin and Identity",
    description: "Redirects to the company narrative at /company/rinpo-story. Product details live at /rinpo.",
    pageType: "company",
  },
  {
    path: "/rinpo/voice",
    indexable: true,
    title: "RINPO Voice | RINADS",
    description: "Browser speech input and output for the RINPO experience.",
    pageType: "product",
  },
  {
    path: "/rinpo/live",
    indexable: true,
    title: "RINPO Live | Talk to RINPO on video",
    description: "A live, two-way video conversation with the RINPO character in English or Malayalam, answering from RINADS's public platform information.",
    pageType: "product",
  },
  {
    path: "/rinpo/phone",
    indexable: true,
    title: "RINPO Phone | Product Direction",
    description: "Product direction for governed business calling — not a live telephony provider claim.",
    pageType: "product",
  },
  {
    path: "/solutions",
    indexable: true,
    title: "Solutions | Industry RINASPACES",
    description: "Industry environments — RI SALON RINASPACE, jewellery, landscape, retail and logistics — on the shared RINADS platform.",
    pageType: "solution",
  },
  {
    path: "/solutions/retail",
    indexable: true,
    title: "Retail RINASPACE | RINADS",
    description: "Catalogue, inventory, storefront, orders, and customer growth for retail teams.",
    pageType: "solution",
  },
  {
    path: "/solutions/salon",
    indexable: true,
    title: "RI SALON RINASPACE | RINADS",
    description: "Appointments, clients, services, loyalty, and campaigns. Pilot — R GLOW is the current implementation name.",
    pageType: "solution",
  },
  {
    path: "/solutions/landscape",
    indexable: true,
    title: "RI LANDSCAPE RINASPACE | RINADS",
    description: "Inventory, project work, field operations, and customer management for nursery businesses.",
    pageType: "solution",
  },
  {
    path: "/solutions/nursery",
    indexable: false,
    canonical: "/solutions/landscape",
    title: "Landscape & Nursery (legacy path)",
    description: "Redirects to /solutions/landscape.",
    pageType: "solution",
  },
  {
    path: "/solutions/jewellery",
    indexable: true,
    title: "RI JEWELLERY RINASPACE | RINADS",
    description: "Collections, appointments, CRM, and brand content — coming soon.",
    pageType: "solution",
  },
  {
    path: "/solutions/healthcare",
    indexable: true,
    title: "Healthcare Solution | RINADS",
    description: "Scheduling and practice workflows — coming soon on the shared platform core.",
    pageType: "solution",
  },
  {
    path: "/solutions/logistics",
    indexable: true,
    title: "Logistics RINASPACE | RINADS",
    description: "Shipment operations and exception control — coming soon.",
    pageType: "solution",
  },
  {
    path: "/solutions/automotive",
    indexable: false,
    canonical: "/solutions",
    title: "Automotive (not in launch set) | RINADS",
    description: "Redirects to Industry RINASPACES. Automotive is not part of the public launch story.",
    pageType: "solution",
  },
  {
    path: "/rinaspace",
    indexable: true,
    title: "Industry RINASPACES | RINADS",
    description:
      "Industry environments on the RINADS platform. RI SALON RINASPACE is in pilot; jewellery and logistics are coming soon.",
    pageType: "solution",
  },
  {
    path: "/customers",
    indexable: true,
    title: "Customers | RINADS",
    description: "How organisations use RINADS to run connected business operations.",
    pageType: "customer",
  },
  {
    path: "/pricing",
    indexable: true,
    title: "Pricing | RINADS",
    description:
      "Software subscription plans for Start, Grow, Scale, and Enterprise. Implementation services priced separately.",
    pageType: "pricing",
  },
  {
    path: "/trust",
    indexable: true,
    title: "Trust | RINADS",
    description: "Security, availability labels, privacy, and honest service status for operators and buyers.",
    pageType: "security",
  },
  {
    path: "/trust/security",
    indexable: true,
    title: "Security | RINADS",
    description: "How RINADS operates AI inside business controls — identity, permissions, approvals, and auditability.",
    pageType: "security",
  },
  {
    path: "/trust/availability",
    indexable: true,
    title: "Availability | RINADS",
    description: "What Available, Pilot, Preview, and Roadmap mean across RINADS marketing surfaces.",
    pageType: "security",
  },
  {
    path: "/trust/privacy",
    indexable: true,
    title: "Privacy | RINADS",
    description: "Privacy hub linking to the company privacy policy and related legal pages.",
    pageType: "legal",
  },
  {
    path: "/trust/status",
    indexable: true,
    title: "Status | RINADS",
    description: "Service status for RINADS public surfaces. Claims are only published when backed by monitoring.",
    pageType: "utility",
  },
  {
    path: "/security",
    indexable: false,
    canonical: "/trust/security",
    title: "Security (legacy path)",
    description: "Redirects to /trust/security.",
    pageType: "security",
  },
  {
    path: "/integrations",
    indexable: true,
    title: "Integrations | RINADS",
    description: "Connect tools to RINADS. Every integration declares live, beta, private preview, or planned status.",
    pageType: "product",
  },
  {
    path: "/resources/academy",
    indexable: false,
    canonical: "/labs",
    title: "Academy (legacy path) | RINADS",
    description: "Redirects to RI LABS.",
    pageType: "resource",
    schemaTypes: ["Course"],
  },
  {
    path: "/labs",
    indexable: true,
    title: "RI LABS | Learning and experimentation",
    description: "Learning, certification, training, experimentation and workforce development on RINADS.",
    pageType: "resource",
    schemaTypes: ["Course"],
  },
  {
    path: "/resources/docs",
    indexable: true,
    title: "Documentation | RINADS Resources",
    description: "Documentation hub linking to stable foundation topics only.",
    pageType: "docs",
  },
  {
    path: "/resources/developers",
    indexable: true,
    title: "Developers | RINADS Resources",
    description: "Authentication, organisation model, APIs, webhooks, and events — only stable interfaces.",
    pageType: "developers",
  },
  {
    path: "/resources/guides",
    indexable: true,
    title: "Guides | RINADS Resources",
    description: "Practical operating guides published as they become available.",
    pageType: "resource",
  },
  {
    path: "/resources/case-studies",
    indexable: false,
    canonical: "/customers",
    title: "Case Studies | RINADS",
    description: "Redirects to verified customer stories at /customers.",
    pageType: "customer",
  },
  {
    path: "/docs",
    indexable: false,
    canonical: "/resources/docs",
    title: "Documentation (legacy path)",
    description: "Redirects to /resources/docs.",
    pageType: "docs",
  },
  {
    path: "/developers",
    indexable: false,
    canonical: "/resources/developers",
    title: "Developers (legacy path)",
    description: "Redirects to /resources/developers.",
    pageType: "developers",
  },
  {
    path: "/developers/api",
    indexable: true,
    title: "API Reference | RINADS Developers",
    description: "API reference for integrations that are contractually stable.",
    pageType: "developers",
  },
  {
    path: "/developers/authentication",
    indexable: true,
    title: "Authentication | RINADS Developers",
    description: "How applications authenticate to RINADS developer interfaces.",
    pageType: "developers",
  },
  {
    path: "/developers/webhooks",
    indexable: true,
    title: "Webhooks | RINADS Developers",
    description: "Webhook delivery model for supported platform events.",
    pageType: "developers",
  },
  {
    path: "/developers/events",
    indexable: true,
    title: "Events | RINADS Developers",
    description: "Event types used across governed workflows and integrations.",
    pageType: "developers",
  },
  {
    path: "/about",
    indexable: false,
    canonical: "/company",
    title: "About RINADS (legacy path)",
    description: "Redirects to /company.",
    pageType: "company",
  },
  {
    path: "/company/founder",
    indexable: true,
    title: "Founder | RINADS",
    description: "Verified founder information for RINADS Technologies.",
    pageType: "company",
  },
  {
    path: "/company/story",
    indexable: true,
    title: "Company Story | RINADS",
    description: "Why RINADS is building a connected operating layer for growing businesses.",
    pageType: "company",
  },
  {
    path: "/company/contact",
    indexable: true,
    title: "Contact | Book a demo with RINADS",
    description: "Book a demo, talk to sales, or start an implementation conversation.",
    pageType: "form",
  },
  {
    path: "/company/careers",
    indexable: true,
    title: "Careers | RINADS",
    description: "Join the team building the operating layer for modern businesses.",
    pageType: "company",
    schemaTypes: ["JobPosting"],
  },
  {
    path: "/contact",
    indexable: false,
    canonical: "/company/contact",
    title: "Contact (legacy path)",
    description: "Redirects to /company/contact.",
    pageType: "form",
  },
  {
    path: "/projects",
    indexable: true,
    title: "Start a Project | RINADS",
    description: "Tell us what you want to achieve — run the business, automate work, launch commerce, or build software.",
    pageType: "form",
  },
  {
    path: "/resources",
    indexable: true,
    title: "Resources | RINADS Knowledge Hub",
    description: "Guides, architecture notes, implementation playbooks, and customer stories.",
    pageType: "resource",
  },
  {
    path: "/business-readiness",
    indexable: true,
    title: "Business Readiness Assessment | RINADS",
    description:
      "RINADS Business Readiness Assessment — practical pathway guidance for growing businesses. Not a certification.",
    pageType: "resource",
  },
  {
    path: "/resources/business-readiness",
    indexable: false,
    canonical: "/business-readiness",
    title: "Business Readiness (legacy path)",
    description: "Redirects to /business-readiness.",
    pageType: "resource",
  },
  {
    path: "/use-cases",
    indexable: true,
    title: "Use Cases | RINADS",
    description: "High-intent outcomes on the RINADS platform — CRM, automation, inventory, and more.",
    pageType: "solution",
  },
  {
    path: "/use-cases/crm",
    indexable: true,
    title: "CRM Use Case | RINADS",
    description: "Run customers and follow-ups on the Business pillar instead of a disconnected CRM silo.",
    pageType: "solution",
  },
  {
    path: "/use-cases/lead-management",
    indexable: true,
    title: "Lead Management | RINADS",
    description: "Capture, qualify, and route leads into governed workflows on the shared platform core.",
    pageType: "solution",
  },
  {
    path: "/use-cases/customer-follow-up",
    indexable: true,
    title: "Customer Follow-up | RINADS",
    description: "Automate reminders and human touchpoints with approvals where required.",
    pageType: "solution",
  },
  {
    path: "/use-cases/project-management",
    indexable: true,
    title: "Project Management | RINADS",
    description: "Run delivery work alongside customers and billing on the Business pillar.",
    pageType: "solution",
  },
  {
    path: "/use-cases/business-automation",
    indexable: true,
    title: "Business Automation | RINADS",
    description: "Replace repetitive handoffs with workflows, agents, and approval gates.",
    pageType: "solution",
  },
  {
    path: "/use-cases/inventory-management",
    indexable: true,
    title: "Inventory Management | RINADS",
    description: "Track stock across commerce and operations with shared catalogue context.",
    pageType: "solution",
  },
  {
    path: "/use-cases/marketing-automation",
    indexable: true,
    title: "Marketing Automation | RINADS",
    description: "Plan campaigns and content on Growth with CRM-connected audiences.",
    pageType: "solution",
  },
  {
    path: "/use-cases/ai-business-assistant",
    indexable: true,
    title: "AI Business Assistant | RINADS",
    description: "Use RINPO to understand, recommend, and prepare governed actions across the platform.",
    pageType: "solution",
  },
  {
    path: "/changelog",
    indexable: true,
    title: "Changelog | RINADS",
    description: "Product updates and platform changes.",
    pageType: "resource",
  },
  {
    path: "/careers",
    indexable: false,
    canonical: "/company/careers",
    title: "Careers (legacy path)",
    description: "Redirects to /company/careers.",
    pageType: "company",
    schemaTypes: ["JobPosting"],
  },
  {
    path: "/status",
    indexable: false,
    canonical: "/trust/status",
    title: "Status (legacy path)",
    description: "Redirects to /trust/status.",
    pageType: "utility",
  },
  {
    path: "/company",
    indexable: true,
    title: "Company | RINADS",
    description: "About RINADS, contact, and company information.",
    pageType: "company",
  },
  {
    path: "/company/privacy",
    indexable: true,
    title: "Privacy Policy | RINADS",
    description: "How RINADS collects, uses, and protects information.",
    pageType: "legal",
  },
  {
    path: "/company/terms",
    indexable: true,
    title: "Terms of Service | RINADS",
    description: "Terms governing use of the RINADS website and platform.",
    pageType: "legal",
  },
  {
    path: "/company/cookies",
    indexable: true,
    title: "Cookie Policy | RINADS",
    description: "How RINADS uses cookies and similar technologies.",
    pageType: "legal",
  },
  {
    path: "/company/rinpo-story",
    indexable: true,
    title: "RINPO Story | Company Narrative",
    description: "Narrative and origin material for RINPO. Product details live at /rinpo.",
    pageType: "company",
  },
  {
    path: "/legal/dpa",
    indexable: true,
    title: "Data Processing Addendum | RINADS",
    description: "Data processing terms for organisations using RINADS — pending counsel-approved publication.",
    pageType: "legal",
  },
  {
    path: "/legal/subprocessors",
    indexable: true,
    title: "Subprocessors | RINADS",
    description: "Subprocessors engaged to deliver RINADS services — pending counsel-approved publication.",
    pageType: "legal",
  },
  {
    path: "/services",
    indexable: true,
    title: "Services | RINADS Implementation",
    description: "Implementation, creative, growth, automation, transformation, and training around the platform.",
    pageType: "product",
    schemaTypes: ["Service"],
  },
  {
    path: "/academy",
    indexable: false,
    canonical: "/labs",
    title: "Academy (legacy path)",
    description: "Redirects to /labs.",
    pageType: "product",
    schemaTypes: ["Course"],
  },
  // Non-indexable
  {
    path: "/signup",
    indexable: false,
    title: "Sign in | RINADS",
    description: "Sign in or create a RINADS account.",
    pageType: "auth",
  },
  {
    path: "/os",
    indexable: false,
    title: "Workspace | RINADS",
    description: "Authenticated organisation workspace.",
    pageType: "app",
  },
  {
    path: "/os/customers",
    indexable: false,
    title: "Customers | Business OS",
    description: "Customers module in Business OS.",
    pageType: "app",
  },
  {
    path: "/os/work",
    indexable: false,
    title: "Work | Business OS",
    description: "Work module in Business OS.",
    pageType: "app",
  },
  {
    path: "/os/money",
    indexable: false,
    title: "Money | Business OS",
    description: "Money module in Business OS.",
    pageType: "app",
  },
  {
    path: "/os/growth",
    indexable: false,
    title: "Growth | Business OS",
    description: "Growth module in Business OS.",
    pageType: "app",
  },
  {
    path: "/os/automate",
    indexable: false,
    title: "Automate | Business OS",
    description: "Automate module in Business OS.",
    pageType: "app",
  },
  {
    path: "/os/rooms",
    indexable: false,
    title: "Rooms | Business OS",
    description: "Rooms collaboration in Business OS.",
    pageType: "app",
  },
  {
    path: "/os/settings",
    indexable: false,
    title: "Settings | Business OS",
    description: "Settings in Business OS.",
    pageType: "app",
  },
  {
    path: "/onboarding/create-organization",
    indexable: false,
    title: "Create organisation | RINADS",
    description: "Organisation onboarding.",
    pageType: "app",
  },
  {
    path: "/onboarding/provisioning",
    indexable: false,
    title: "Provisioning | RINADS",
    description: "Organisation provisioning status.",
    pageType: "app",
  },
  {
    path: "/services/checkout",
    indexable: false,
    title: "Checkout | RINADS",
    description: "Service checkout.",
    pageType: "app",
  },
  {
    path: "/track",
    indexable: false,
    title: "Order tracking | RINADS",
    description: "Order status tracking.",
    pageType: "app",
  },
  {
    path: "/story-concept",
    indexable: false,
    title: "Story concept (unpublished)",
    description: "Internal concept surface — not for indexing.",
    pageType: "utility",
  },
];

export function getRouteDefinition(path: string): RouteDefinition | undefined {
  const normalized = path === "" ? "/" : path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;
  return ROUTE_REGISTRY.find((route) => route.path === normalized);
}

export function getIndexableRoutes(): RouteDefinition[] {
  return ROUTE_REGISTRY.filter((route) => route.indexable);
}

export function getCanonicalUrl(path: string): string {
  const route = getRouteDefinition(path);
  const canonicalPath = route?.canonical ?? route?.path ?? path;
  const base = siteUrl().replace(/\/$/, "");
  return canonicalPath === "/" ? base : `${base}${canonicalPath}`;
}

export function metadataFromRegistry(path: string) {
  const route = getRouteDefinition(path);
  if (!route) return null;
  const canonical = getCanonicalUrl(path);
  return {
    title: route.title,
    description: route.description,
    alternates: { canonical },
    openGraph: {
      title: route.title,
      description: route.description,
      url: canonical,
      type: "website" as const,
      images: route.ogImage ? [{ url: route.ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: route.title,
      description: route.description,
    },
    robots: route.indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}
