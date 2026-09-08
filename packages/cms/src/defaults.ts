import type { CmsStore, ServiceCardContent, SiteSeo } from "./types";

export const DEFAULT_SERVICE_CARDS: ServiceCardContent[] = [
  {
    title: "Software",
    description: "Build web apps, mobile apps, and business systems through Build OS.",
    details: ["Web Apps", "Mobile Apps", "Business Systems"],
    href: "/services/software",
  },
  {
    title: "Marketing",
    description: "Grow brands with SEO, paid media, social, and CRM programs.",
    details: ["SEO", "Performance Ads", "Social"],
    href: "/services/marketing",
  },
  {
    title: "AI & Automation",
    description: "Assistants, agents, and workflows powered by RINPO Runtime.",
    details: ["AI Assistants", "Workflows", "Voice Agents"],
    href: "/services/ai",
  },
];

export const DEFAULT_ABOUT = {
  eyebrow: "About RINADS",
  headline: "The AI Operating Platform for Business.",
  body: "RINADS® is an intelligent operating platform — run, build, grow, learn, and automate through one ecosystem powered by RINPO.",
  subbody: "RINPO is the interface. RINADS Intelligence is the brain. RINADS is the operating platform.",
};

function seo(
  id: string,
  path: string,
  title: string,
  description: string,
  opts?: Partial<SiteSeo>,
): SiteSeo {
  return {
    id,
    path,
    title,
    description,
    ogTitle: opts?.ogTitle ?? title,
    ogDescription: opts?.ogDescription ?? description,
    robotsIndex: opts?.robotsIndex ?? true,
    robotsFollow: opts?.robotsFollow ?? true,
    updatedAt: new Date(0).toISOString(),
  };
}

export const DEFAULT_SEO: SiteSeo[] = [
  seo(
    "seo_home",
    "/",
    "RINADS | The AI Operating Platform for Business",
    "Run your business. Build your software. Grow your brand. Automate your operations. Train your people. One intelligent platform powered by RINPO.",
  ),
  seo(
    "seo_platform",
    "/platform",
    "RINADS Platform | AI Operating Systems for Business",
    "Explore Business OS, Commerce OS, Marketing OS, Logistics OS, Creative OS, Build OS, Academy OS, Automation OS, Intelligence, and Cloud.",
  ),
  seo(
    "seo_business_os_new",
    "/platform/business-os",
    "Business OS | RINADS",
    "Run customers, work, money, growth, automation, and intelligence from one workspace.",
  ),
  seo(
    "seo_commerce_os",
    "/platform/commerce-os",
    "Commerce OS | RINADS",
    "Products, catalogue, inventory, storefront, orders, payments, and AI commerce.",
  ),
  seo(
    "seo_marketing_os",
    "/platform/marketing-os",
    "Marketing OS | RINADS",
    "Content, campaigns, Meta, Google, SEO, WhatsApp, email, analytics, and CRM.",
  ),
  seo(
    "seo_logistics_os",
    "/platform/logistics-os",
    "Logistics OS | RINADS",
    "Provider-neutral control tower for orders, shipments, couriers, 3PL, tracking, and returns.",
  ),
  seo(
    "seo_creative_os",
    "/platform/creative-os",
    "Creative OS | RINADS",
    "AI image, video, film, product studio, brand OS, story and script studios.",
  ),
  seo(
    "seo_build_os",
    "/platform/build-os",
    "Build OS | RINADS",
    "Software factory from discovery and PRD through deployment and monitoring.",
  ),
  seo(
    "seo_academy_os",
    "/platform/academy-os",
    "Academy OS | RINADS",
    "Real Experience Academy — learn, practice, work, ship, measure, improve, certify.",
  ),
  seo(
    "seo_automation_os",
    "/platform/automation-os",
    "Automation OS | RINADS",
    "Workflows, triggers, integrations, agent runtime, and audited automation.",
  ),
  seo(
    "seo_rinads_intelligence",
    "/platform/rinads-intelligence",
    "RINADS Intelligence | The Brain of the Platform",
    "Business graph, event graph, memory, analytics, decision engines, permissions, audit, and agent runtime.",
  ),
  seo(
    "seo_rinads_cloud",
    "/platform/rinads-cloud",
    "RINADS Cloud | Platform Foundation",
    "Data, AI, APIs, integrations, events, storage, security, automation, and infrastructure.",
  ),
  seo(
    "seo_rinpo",
    "/rinpo",
    "RINPO | AI Business Interface",
    "RINPO is the persistent AI interface — assistant, tutor, operator, voice and phone agent.",
  ),
  seo(
    "seo_rinpo_intel",
    "/rinpo/intelligence",
    "RINPO Intelligence | RINADS",
    "How RINPO connects to RINADS Intelligence for understanding and next actions.",
  ),
  seo(
    "seo_rinpo_story_new",
    "/rinpo/story",
    "RINPO Story | RINADS",
    "The origin story of RINPO — RINADS Intelligent Navigation & Process Oracle.",
  ),
  seo(
    "seo_rinpo_voice",
    "/rinpo/voice",
    "RINPO Voice | RINADS",
    "Talk to your business through RINPO voice channels.",
  ),
  seo(
    "seo_rinpo_phone",
    "/rinpo/phone",
    "RINPO Phone | RINADS",
    "AI phone agent for calls, follow-ups, and business conversations.",
  ),
  seo(
    "seo_academy",
    "/academy",
    "RINADS Academy | Real Experience Academy",
    "Learn, practice, work, ship, measure, improve, and certify — with RINPO as tutor.",
  ),
  seo(
    "seo_academy_university",
    "/academy/university",
    "RINADS University | Academy",
    "The full Real Experience Academy system inside RINADS.",
  ),
  seo(
    "seo_academy_programs",
    "/academy/programs",
    "Academy Programs | RINADS",
    "Structured learning paths across founder, AI, software, marketing, and creator schools.",
  ),
  seo(
    "seo_academy_live",
    "/academy/live",
    "Live Classes | RINADS Academy",
    "Instructor-led live classes with assignments and real business outcomes.",
  ),
  seo(
    "seo_academy_ai",
    "/academy/ai",
    "AI School | RINADS Academy",
    "Train people to operate with RINPO and RINADS Intelligence.",
  ),
  seo(
    "seo_academy_film",
    "/academy/filmmaking",
    "AI Filmmaking | RINADS Academy",
    "Create films with Creative OS — story, script, voice, music, and AI production.",
  ),
  seo(
    "seo_academy_founder",
    "/academy/founder",
    "Founder School | RINADS Academy",
    "Build and run companies on the RINADS operating platform.",
  ),
  seo(
    "seo_academy_software",
    "/academy/software",
    "Software School | RINADS Academy",
    "Ship products through Build OS — from discovery to deployment.",
  ),
  seo(
    "seo_academy_marketing",
    "/academy/marketing",
    "Marketing School | RINADS Academy",
    "Grow brands with Marketing OS skills practiced on real work.",
  ),
  seo(
    "seo_academy_creator",
    "/academy/creator",
    "Creator School | RINADS Academy",
    "Build a creator practice on Creative OS with RINPO tutoring.",
  ),
  seo(
    "seo_solutions",
    "/solutions",
    "Industry Solutions | RINADS Vertical OS",
    "Business OS configured for retail, jewellery, nursery, salon, healthcare, logistics, and more.",
  ),
  seo(
    "seo_solutions_retail",
    "/solutions/retail",
    "Retail OS | RINADS Solutions",
    "Retail operations on the RINADS core — catalogue, storefront, orders, and growth.",
  ),
  seo(
    "seo_solutions_jewellery",
    "/solutions/jewellery",
    "Jewellery OS | RINADS Solutions",
    "Jewellery commerce and brand operations on RINADS.",
  ),
  seo(
    "seo_solutions_nursery",
    "/solutions/nursery",
    "Nursery OS | RINADS Solutions",
    "Nursery and landscaping operations — live vertical template.",
  ),
  seo(
    "seo_solutions_salon",
    "/solutions/salon",
    "Salon OS | RINADS Solutions",
    "Salon appointments, clients, and growth on RINADS.",
  ),
  seo(
    "seo_solutions_healthcare",
    "/solutions/healthcare",
    "Healthcare OS | RINADS Solutions",
    "Clinic and practice operations configured on the RINADS core.",
  ),
  seo(
    "seo_solutions_logistics",
    "/solutions/logistics",
    "Logistics Solutions | RINADS",
    "Provider-neutral logistics control tower on Logistics OS.",
  ),
  seo(
    "seo_services",
    "/services",
    "RINADS Services | Build Grow Automate Create Transform Train",
    "Human delivery capability across software, marketing, AI, creative, automation, transformation, and training.",
  ),
  seo(
    "seo_services_software",
    "/services/software",
    "Software Services | RINADS",
    "Build software with RINADS — apps, systems, commerce, and product teams.",
  ),
  seo(
    "seo_services_marketing",
    "/services/marketing",
    "Marketing Services | RINADS",
    "Grow your brand with SEO, paid media, social, and CRM programs.",
  ),
  seo(
    "seo_services_ai",
    "/services/ai",
    "AI Services | RINADS",
    "AI assistants, agents, and intelligence systems wired into RINPO.",
  ),
  seo(
    "seo_services_creative",
    "/services/creative",
    "Creative Services | RINADS",
    "Brand and media production with Creative OS.",
  ),
  seo(
    "seo_services_automation",
    "/services/automation",
    "Automation Services | RINADS",
    "Workflow design, integrations, and agentic automation.",
  ),
  seo(
    "seo_services_transformation",
    "/services/transformation",
    "Transformation Services | RINADS",
    "Move from scattered tools to one intelligent operating platform.",
  ),
  seo(
    "seo_services_training",
    "/services/training",
    "Training Services | RINADS",
    "Team and founder training through Real Experience Academy.",
  ),
  seo(
    "seo_resources",
    "/resources",
    "Resources | RINADS",
    "Architecture explainers, platform guides, and paths into RINADS.",
  ),
  seo(
    "seo_company",
    "/company",
    "Company | RINADS",
    "About RINADS — the AI Operating Platform for Business.",
  ),
  seo(
    "seo_projects",
    "/projects",
    "Start a Project | RINADS",
    "Tell us about your vision. RINADS crafts bold ideas and ships them as products.",
  ),
  seo(
    "seo_signup",
    "/signup",
    "Sign Up | RINADS",
    "Create your RINADS account and start with the AI Operating Platform.",
  ),
  seo("seo_os", "/os", "RINADS Business OS", "Authenticated workspace launcher with RINPO dock.", {
    robotsIndex: false,
    robotsFollow: false,
  }),
  seo(
    "seo_company_privacy",
    "/company/privacy",
    "Privacy Policy | RINADS",
    "How RINADS collects, uses, and protects information across the platform.",
  ),
  seo(
    "seo_company_terms",
    "/company/terms",
    "Terms of Service | RINADS",
    "The terms that govern use of the RINADS platform and RINPO.",
  ),
  seo(
    "seo_company_cookies",
    "/company/cookies",
    "Cookie Policy | RINADS",
    "How RINADS uses cookies and similar technologies.",
  ),
  // Legacy path SEO retained for historical CMS lookups
  seo(
    "seo_grow",
    "/grow",
    "Marketing OS | RINADS",
    "Content, campaigns, and growth — redirected to Marketing OS.",
  ),
  seo(
    "seo_rinpo_story",
    "/rinpo-story",
    "RINPO Story | RINADS",
    "The origin story of RINPO.",
  ),
  seo(
    "seo_business_os",
    "/business-os",
    "Business OS | RINADS",
    "Run your business from one intelligent workspace.",
  ),
  seo(
    "seo_rinpo_intelligence",
    "/rinpo-intelligence",
    "RINADS Intelligence | RINADS",
    "The brain of the operating platform.",
  ),
  seo(
    "seo_cloud",
    "/cloud",
    "RINADS Cloud | Platform Foundation",
    "Data, AI, APIs, and infrastructure behind RINADS.",
  ),
];

export function createDefaultCmsStore(): CmsStore {
  const now = new Date().toISOString();
  return {
    pages: [
      {
        id: "page_home",
        slug: "home",
        title: "RINADS Home",
        layoutKey: "marketing",
        status: "published",
        updatedAt: now,
        sections: {
          "services.cards": DEFAULT_SERVICE_CARDS,
          about: DEFAULT_ABOUT,
        },
      },
      {
        id: "page_grow",
        slug: "grow",
        title: "RINADS Grow",
        layoutKey: "grow",
        status: "published",
        updatedAt: now,
        sections: {},
      },
      {
        id: "page_projects",
        slug: "projects",
        title: "Start a Project",
        layoutKey: "projects",
        status: "published",
        updatedAt: now,
        sections: {},
      },
      {
        id: "page_rinpo_story",
        slug: "rinpo-story",
        title: "RINPO Story",
        layoutKey: "story",
        status: "published",
        updatedAt: now,
        sections: {},
      },
      {
        id: "page_signup",
        slug: "signup",
        title: "Sign Up",
        layoutKey: "auth",
        status: "published",
        updatedAt: now,
        sections: {},
      },
    ],
    seo: DEFAULT_SEO.map((row) => ({ ...row, updatedAt: now })),
    redirects: [
      { id: "redir_business_os", fromPath: "/business-os", toPath: "/platform/business-os", permanent: true, createdAt: now },
      { id: "redir_rinpo_intel", fromPath: "/rinpo-intelligence", toPath: "/platform/rinads-intelligence", permanent: true, createdAt: now },
      { id: "redir_cloud", fromPath: "/cloud", toPath: "/platform/rinads-cloud", permanent: true, createdAt: now },
      { id: "redir_rinads_cloud", fromPath: "/rinads-cloud", toPath: "/platform/rinads-cloud", permanent: true, createdAt: now },
      { id: "redir_rinpo_story", fromPath: "/rinpo-story", toPath: "/rinpo/story", permanent: true, createdAt: now },
      { id: "redir_grow", fromPath: "/grow", toPath: "/platform/marketing-os", permanent: true, createdAt: now },
    ],
    media: [],
  };
}

export function getDefaultSeoForPath(path: string): SiteSeo | null {
  const normalized = path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;
  return DEFAULT_SEO.find((row) => row.path === normalized) ?? null;
}

export function getDefaultServiceCards(): ServiceCardContent[] {
  return DEFAULT_SERVICE_CARDS.map((card) => ({ ...card, details: [...card.details] }));
}

export function getDefaultAbout() {
  return { ...DEFAULT_ABOUT };
}
