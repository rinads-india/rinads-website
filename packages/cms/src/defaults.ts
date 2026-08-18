import type { CmsStore, ServiceCardContent, SiteSeo } from "./types";

export const DEFAULT_SERVICE_CARDS: ServiceCardContent[] = [
  {
    title: "Digital Marketing",
    description: "SEO, Social Media, and Performance Ads that turn attention into growth.",
    details: ["SEO", "Social Media", "Performance Ads"],
    href: "/grow",
  },
  {
    title: "Custom Software Development",
    description: "Web Apps, Mobile Apps, and ERP systems built to run your business.",
    details: ["Web Apps", "Mobile Apps", "ERP Systems"],
  },
  {
    title: "AI Automation",
    description: "Chatbots, workflow automation, and AI tools that simplify operations.",
    details: ["Chatbots", "Workflow Automation", "AI Tools"],
  },
];

export const DEFAULT_ABOUT = {
  eyebrow: "About RINADS",
  headline: "A business technology platform.",
  body: "RINADS® is a Business Operating System that connects customers, work, finance, marketing and automation — with RINPO Intelligence helping you manage it.",
  subbody: "Business OS · RINPO Intelligence · RINADS Cloud · Services. Built to run businesses.",
};

export const DEFAULT_SEO: SiteSeo[] = [
  {
    id: "seo_home",
    path: "/",
    title: "RINADS | Run Your Business From One Place",
    description:
      "RINADS Business OS connects CRM, projects, finance, marketing and automation into one intelligent workspace — with RINPO Intelligence.",
    ogTitle: "RINADS | Business Technology Platform",
    ogDescription:
      "Run your business from one place. Business OS, RINPO Intelligence, and connected automation.",
    robotsIndex: true,
    robotsFollow: true,
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "seo_grow",
    path: "/grow",
    title: "RINADS Grow — Marketing That Scales With Intelligence",
    description:
      "RINADS Grow is RINADS' digital marketing platform — SEO, paid media, and social growth you browse on the web, buy through RINADS, and manage inside Business OS.",
    ogTitle: "RINADS Grow — Marketing That Scales With Intelligence",
    ogDescription:
      "Browse SEO, paid media, and social growth packages. Launch campaigns through RINADS and manage them in Business OS.",
    robotsIndex: true,
    robotsFollow: true,
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "seo_projects",
    path: "/projects",
    title: "Start a Project | RINADS",
    description:
      "Tell us about your vision. RINADS crafts bold ideas and ships them as products — websites, apps, commerce, and growth.",
    ogTitle: "Start a Project | RINADS",
    ogDescription: "Tell us about your vision. RINADS crafts bold ideas and ships them as products.",
    robotsIndex: true,
    robotsFollow: true,
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "seo_rinpo_story",
    path: "/rinpo-story",
    title: "RINPO Story | RINADS",
    description: "The origin story of RINPO — RINADS intelligence avatar and Business Cloud companion.",
    ogTitle: "RINPO Story | RINADS",
    ogDescription: "Discover how RINPO powers RINADS Business Cloud.",
    robotsIndex: true,
    robotsFollow: true,
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "seo_signup",
    path: "/signup",
    title: "Sign Up | RINADS",
    description: "Create your RINADS account and access Business OS, client portal, and growth tools.",
    ogTitle: "Sign Up | RINADS",
    ogDescription: "Create your RINADS account.",
    robotsIndex: true,
    robotsFollow: true,
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "seo_os",
    path: "/os",
    title: "RINADS Business OS",
    description: "RINADS Business OS — workspace launcher with RINPO intelligence dock.",
    ogTitle: "RINADS Business OS",
    ogDescription: "Authenticated workspace launcher.",
    robotsIndex: false,
    robotsFollow: false,
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "seo_business_os",
    path: "/business-os",
    title: "RINADS Business OS — Your Business, Connected",
    description:
      "One operating system for customers, work, finance, growth and automation. Run your business from one intelligent workspace.",
    ogTitle: "RINADS Business OS",
    ogDescription: "Your business, connected.",
    robotsIndex: true,
    robotsFollow: true,
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "seo_rinpo_intelligence",
    path: "/rinpo-intelligence",
    title: "RINPO Intelligence | RINADS",
    description:
      "RINPO turns your business data into direction — insights, recommendations, and contextual intelligence across Business OS.",
    ogTitle: "RINPO Intelligence",
    ogDescription: "Understand your business. Know what to do next.",
    robotsIndex: true,
    robotsFollow: true,
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "seo_cloud",
    path: "/cloud",
    title: "RINADS Cloud — The Platform Behind RINADS",
    description:
      "RINADS Cloud connects your business applications, data, integrations and services into one ecosystem.",
    ogTitle: "RINADS Cloud",
    ogDescription: "Connected data and ecosystem.",
    robotsIndex: true,
    robotsFollow: true,
    updatedAt: new Date(0).toISOString(),
  },
  {
    id: "seo_services",
    path: "/services",
    title: "RINADS Services — Build. Grow. Automate.",
    description:
      "Custom software, growth marketing, AI automation, and business systems — RINADS Services help you build and grow.",
    ogTitle: "RINADS Services",
    ogDescription: "Build. Grow. Automate.",
    robotsIndex: true,
    robotsFollow: true,
    updatedAt: new Date(0).toISOString(),
  },
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
    redirects: [],
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
