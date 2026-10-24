/**
 * Reusable JSON-LD helpers for commercial marketing pages.
 * Do not emit fabricated openings or class schedules via schema types
 * that imply live hiring or course calendars.
 */

const DEFAULT_SITE_URL = "https://www.rinads.com";

function siteUrl(override?: string) {
  return (override ?? process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).replace(/\/$/, "");
}

function absoluteUrl(path: string, base?: string) {
  const root = siteUrl(base);
  if (!path || path === "/") return root;
  return `${root}${path.startsWith("/") ? path : `/${path}`}`;
}

export type JsonLdObject = Record<string, unknown>;

export function buildOrganizationJsonLd(baseUrl?: string): JsonLdObject {
  const url = siteUrl(baseUrl);
  const sameAs = [
    process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN,
    process.env.NEXT_PUBLIC_SOCIAL_X,
    process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK,
  ].filter((value): value is string => Boolean(value?.trim()));

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RINADS",
    legalName: "RINADS Technologies",
    url,
    logo: `${url}/assets/rinads-logo.png`,
    ...(sameAs.length ? { sameAs } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Thrissur",
      addressRegion: "Kerala",
      addressCountry: "IN",
    },
  };
}

export function buildWebSiteJsonLd(baseUrl?: string): JsonLdObject {
  const url = siteUrl(baseUrl);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RINADS",
    url,
    publisher: {
      "@type": "Organization",
      name: "RINADS",
      url,
    },
  };
}

export function buildWebPageJsonLd(input: {
  path: string;
  title: string;
  description: string;
  siteUrl?: string;
}): JsonLdObject {
  const url = absoluteUrl(input.path, input.siteUrl);
  const root = siteUrl(input.siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.title,
    description: input.description,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: "RINADS",
      url: root,
    },
  };
}

export function buildBreadcrumbListJsonLd(
  crumbs: Array<{ name: string; path: string }>,
  baseUrl?: string,
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path, baseUrl),
    })),
  };
}

export function buildSoftwareApplicationJsonLd(input?: {
  name?: string;
  description?: string;
  siteUrl?: string;
  offerUrl?: string;
}): JsonLdObject {
  const root = siteUrl(input?.siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input?.name ?? "RINADS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      input?.description ??
      "Business Intelligence Infrastructure for Software-Defined Business. Powered by RINADS INTELLIGENCE. Executed by RINPO RUNTIME.",
    offers: {
      "@type": "Offer",
      url: input?.offerUrl ?? `${root}/contact?intent=demo`,
    },
  };
}

export function buildFAQPageJsonLd(
  items: Array<{ question: string; answer: string }>,
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildLocalBusinessJsonLd(input: {
  name: string;
  url: string;
  city: string;
  region: string;
  country: string;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    url: input.url,
    address: {
      "@type": "PostalAddress",
      addressLocality: input.city,
      addressRegion: input.region,
      addressCountry: input.country,
    },
  };
}

/** Serialize one or more JSON-LD graphs for a <script type="application/ld+json"> tag. */
export function serializeJsonLd(nodes: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(nodes);
}

export function JsonLdScriptProps(id: string, nodes: JsonLdObject | JsonLdObject[]) {
  return {
    id,
    type: "application/ld+json" as const,
    dangerouslySetInnerHTML: { __html: serializeJsonLd(nodes) },
  };
}
