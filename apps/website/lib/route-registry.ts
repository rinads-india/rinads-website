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
    title: "RINADS | AI Operating Platform for Growing Businesses",
    description:
      "Run customers, work, commerce, marketing and automation on one connected platform. RINPO helps teams understand what needs attention and move approved work forward.",
    pageType: "home",
    schemaTypes: ["Organization", "WebSite", "SoftwareApplication"],
  },
  {
    path: "/platform",
    indexable: true,
    title: "RINADS Platform | Connected Operating Systems",
    description:
      "Explore Business OS, Commerce OS, Marketing OS, and the connected operating systems that share one business foundation.",
    pageType: "product",
  },
  {
    path: "/platform/business-os",
    indexable: true,
    title: "Business OS | RINADS",
    description: "Run customers, work, money, growth, and operations from one connected workspace.",
    pageType: "product",
  },
  {
    path: "/platform/commerce-os",
    indexable: true,
    title: "Commerce OS | RINADS",
    description: "Sell, fulfil, and manage commerce operations on the shared RINADS foundation.",
    pageType: "product",
  },
  {
    path: "/platform/marketing-os",
    indexable: true,
    title: "Marketing OS | RINADS",
    description: "Plan, launch, and measure growth programmes connected to CRM and commerce.",
    pageType: "product",
  },
  {
    path: "/platform/creative-os",
    indexable: true,
    title: "Creative OS | RINADS",
    description: "Create content, image, video, and brand assets inside governed business workflows.",
    pageType: "product",
  },
  {
    path: "/platform/logistics-os",
    indexable: true,
    title: "Logistics OS | RINADS",
    description: "Track shipments, exceptions, and delivery operations from one control surface.",
    pageType: "product",
  },
  {
    path: "/platform/automation-os",
    indexable: true,
    title: "Automation OS | RINADS",
    description: "Connect workflows, approvals, and actions with human control where it matters.",
    pageType: "product",
  },
  {
    path: "/platform/build-os",
    indexable: true,
    title: "Build OS | RINADS",
    description: "Turn requirements into shipped software with structured delivery workflows.",
    pageType: "product",
  },
  {
    path: "/platform/academy-os",
    indexable: true,
    title: "Academy OS | RINADS",
    description: "Train teams through real work connected to the RINADS operating platform.",
    pageType: "product",
  },
  {
    path: "/platform/rinads-intelligence",
    indexable: true,
    title: "RINADS Intelligence | Governed AI for Business",
    description:
      "Context, recommendations, and supported actions that operate inside organisation permissions and approval gates.",
    pageType: "product",
  },
  {
    path: "/platform/rinads-cloud",
    indexable: true,
    title: "RINADS Cloud | Shared Platform Foundation",
    description: "Identity, organisation context, data, APIs, and infrastructure behind RINADS.",
    pageType: "product",
  },
  {
    path: "/rinpo",
    indexable: true,
    title: "RINPO | Persistent AI Interface for RINADS",
    description:
      "Ask, understand, draft, recommend, prepare actions, request approval, and execute only supported actions with permission.",
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
    path: "/rinpo/phone",
    indexable: true,
    title: "RINPO Phone | Product Direction",
    description: "Product direction for governed business calling — not a live telephony provider claim.",
    pageType: "product",
  },
  {
    path: "/solutions",
    indexable: true,
    title: "Industry Solutions | RINADS",
    description: "Retail, salon, nursery, and industry configurations on the shared RINADS core.",
    pageType: "solution",
  },
  {
    path: "/solutions/retail",
    indexable: true,
    title: "Retail Solution | RINADS",
    description: "Catalogue, inventory, storefront, orders, and customer growth for retail teams.",
    pageType: "solution",
  },
  {
    path: "/solutions/salon",
    indexable: true,
    title: "Salon / R GLOW | RINADS",
    description: "Appointments, clients, services, loyalty, and campaigns for salon operations.",
    pageType: "solution",
  },
  {
    path: "/solutions/nursery",
    indexable: true,
    title: "Landscape & Nursery | RINADS",
    description: "Inventory, project work, field operations, and customer management for nursery businesses.",
    pageType: "solution",
  },
  {
    path: "/solutions/jewellery",
    indexable: true,
    title: "Jewellery Solution | RINADS",
    description: "Collections, appointments, CRM, and brand content — private preview / coming soon.",
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
    title: "Logistics Solution | RINADS",
    description: "Shipment operations and exception control — coming soon.",
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
    path: "/security",
    indexable: true,
    title: "Security | RINADS",
    description: "How RINADS operates AI inside business controls — identity, permissions, approvals, and auditability.",
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
    path: "/docs",
    indexable: true,
    title: "Documentation | RINADS",
    description: "Guides and documentation for the RINADS platform.",
    pageType: "docs",
  },
  {
    path: "/developers",
    indexable: true,
    title: "Developers | RINADS",
    description: "Authentication, organisation model, APIs, webhooks, and events — only stable interfaces.",
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
    indexable: true,
    title: "About RINADS | Building the Operating Layer",
    description:
      "RINADS is building a connected alternative to fragmented CRM, commerce, project, marketing, and automation tools.",
    pageType: "company",
  },
  {
    path: "/contact",
    indexable: true,
    title: "Contact | Book a Demo or Talk to RINADS",
    description: "Book a platform demo, talk to sales, or start an implementation conversation.",
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
    path: "/changelog",
    indexable: true,
    title: "Changelog | RINADS",
    description: "Product updates and platform changes.",
    pageType: "resource",
  },
  {
    path: "/careers",
    indexable: true,
    title: "Careers | RINADS",
    description: "Join the team building the operating layer for modern businesses.",
    pageType: "company",
    schemaTypes: ["JobPosting"],
  },
  {
    path: "/status",
    indexable: true,
    title: "Status | RINADS",
    description: "Service status for RINADS public surfaces. Claims are only published when backed by monitoring.",
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
    indexable: true,
    title: "Academy | RINADS",
    description: "Learn by doing real work across AI, software, marketing, and founder programmes.",
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
    title: "Business OS Workspace | RINADS",
    description: "Authenticated Business OS workspace.",
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
