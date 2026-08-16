import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import {
  buildOrganizationJsonLd,
  buildPageMetadata,
  buildWebPageJsonLd,
  findRedirectForPath,
  getAboutFromPage,
  getPageBySlug,
  getSeoByPath,
  getServiceCardsFromPage,
  listPublishedPaths,
  listRedirects,
  type ServiceCardContent,
  type SiteRedirect,
  type SiteSeo,
} from "@rinads/cms";
import { siteBrand } from "@/lib/brand";
import { getWebsiteCmsClient } from "@/lib/cms-client";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rinads.com";

async function loadSeo(path: string): Promise<SiteSeo | null> {
  const client = await getWebsiteCmsClient();
  return getSeoByPath(client, path);
}

async function loadHomePage() {
  const client = await getWebsiteCmsClient();
  return getPageBySlug(client, "home");
}

async function loadRedirects(): Promise<SiteRedirect[]> {
  const client = await getWebsiteCmsClient();
  return listRedirects(client);
}

async function loadPublishedPaths() {
  const client = await getWebsiteCmsClient();
  return listPublishedPaths(client);
}

export const getCachedSeoByPath = unstable_cache(
  async (path: string) => loadSeo(path),
  ["cms-seo"],
  { tags: ["cms"] }
);

export const getCachedHomeContent = unstable_cache(
  async () => {
    const page = await loadHomePage();
    return {
      serviceCards: getServiceCardsFromPage(page),
      about: getAboutFromPage(page),
    };
  },
  ["cms-home"],
  { tags: ["cms"] }
);

export const getCachedRedirects = unstable_cache(loadRedirects, ["cms-redirects"], { tags: ["cms"] });

export const getCachedPublishedPaths = unstable_cache(loadPublishedPaths, ["cms-sitemap"], {
  tags: ["cms"],
});

export async function getPageMetadata(path: string): Promise<Metadata> {
  const seo = await getCachedSeoByPath(path);
  return buildPageMetadata(seo, path, {
    siteUrl,
    siteName: siteBrand.name,
  }) as Metadata;
}

export async function getRedirectForPath(pathname: string): Promise<SiteRedirect | null> {
  const redirects = await getCachedRedirects();
  return findRedirectForPath(redirects, pathname);
}

export function getOrganizationJsonLd() {
  return buildOrganizationJsonLd(siteUrl);
}

export function getWebPageJsonLd(path: string, seo: SiteSeo | null) {
  return buildWebPageJsonLd({
    path,
    title: seo?.title ?? siteBrand.name,
    description: seo?.description ?? "",
    siteUrl,
  });
}

export type HomeCmsContent = {
  serviceCards: ServiceCardContent[];
  about: ReturnType<typeof getAboutFromPage>;
};

export async function getHomeCmsContent(): Promise<HomeCmsContent> {
  return getCachedHomeContent();
}
