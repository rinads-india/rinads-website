import { getDefaultSeoForPath } from "./defaults";
import type { SiteSeo } from "./types";

export type MetadataLike = {
  title?: string;
  description?: string;
  alternates?: { canonical?: string };
  robots?: { index?: boolean; follow?: boolean };
  openGraph?: {
    title?: string;
    description?: string;
    url?: string;
    siteName?: string;
    type?: string;
    images?: Array<{ url: string }>;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    images?: string[];
  };
};

export type BuildMetadataOptions = {
  siteUrl?: string;
  siteName?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
};

export function buildPageMetadata(
  seo: SiteSeo | null,
  path: string,
  options: BuildMetadataOptions = {}
): MetadataLike {
  const siteUrl = options.siteUrl ?? "https://www.rinads.com";
  const siteName = options.siteName ?? "RINADS";
  const fallback = getDefaultSeoForPath(path);
  const row = seo ?? fallback;

  const title = row?.title ?? options.fallbackTitle ?? siteName;
  const description = row?.description ?? options.fallbackDescription ?? "";
  const ogTitle = row?.ogTitle ?? title;
  const ogDescription = row?.ogDescription ?? description;
  const canonical = row?.canonicalUrl ?? `${siteUrl}${path === "/" ? "" : path}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: row?.robotsIndex ?? true,
      follow: row?.robotsFollow ?? true,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      siteName,
      type: "website",
      ...(row?.ogImageUrl ? { images: [{ url: row.ogImageUrl }] } : {}),
    },
    twitter: {
      card: row?.ogImageUrl ? "summary_large_image" : "summary",
      title: ogTitle,
      description: ogDescription,
      ...(row?.ogImageUrl ? { images: [row.ogImageUrl] } : {}),
    },
  };
}

export function buildOrganizationJsonLd(siteUrl = "https://www.rinads.com") {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RINADS",
    url: siteUrl,
    logo: `${siteUrl}/assets/rinads-logo.png`,
    sameAs: [siteUrl],
  };
}

export function buildWebPageJsonLd(input: {
  path: string;
  title: string;
  description: string;
  siteUrl?: string;
}) {
  const siteUrl = input.siteUrl ?? "https://www.rinads.com";
  const url = `${siteUrl}${input.path === "/" ? "" : input.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.title,
    description: input.description,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: "RINADS",
      url: siteUrl,
    },
  };
}
