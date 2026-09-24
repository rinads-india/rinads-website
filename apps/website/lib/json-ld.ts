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
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RINADS",
    url,
    logo: `${url}/assets/rinads-logo.png`,
    sameAs: [url],
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
      "AI operating platform for growing businesses — run customers, work, commerce, marketing and automation with RINPO.",
    offers: {
      "@type": "Offer",
      url: input?.offerUrl ?? `${root}/contact?intent=demo`,
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
