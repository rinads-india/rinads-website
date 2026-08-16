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
  headline: "Business simplified.",
  body: "RINADS® is a software and growth company building Business Cloud, websites, marketing systems, and AI-powered automation — from India to the world.",
  subbody: "Software · Websites · Marketing · AI automation. Built to run businesses.",
};

export const DEFAULT_SEO: SiteSeo[] = [
  {
    id: "seo_home",
    path: "/",
    title: "RINADS | Business Simplified",
    description:
      "RINADS Technologies — AI-powered automation, custom software, and digital marketing. Business Cloud built to run businesses.",
    ogTitle: "RINADS | Business Simplified",
    ogDescription:
      "AI-powered automation, custom software, and digital marketing. Business simplified.",
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
    title: "RINADS Business Operating System",
    description: "RINADS Business OS — workspace launcher with RINPO intelligence dock.",
    ogTitle: "RINADS Business OS",
    ogDescription: "Authenticated workspace launcher.",
    robotsIndex: false,
    robotsFollow: false,
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
