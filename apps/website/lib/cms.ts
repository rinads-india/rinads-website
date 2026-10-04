import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import {
  buildPageMetadata,
  findRedirectForPath,
  getAboutFromPage,
  getBlogPostBySlug,
  getPageBySlug,
  getSeoByPath,
  getServiceCardsFromPage,
  listBlogPosts,
  listPublishedPaths,
  listRedirects,
  type ServiceCardContent,
  type SiteBlogPost,
  type SiteRedirect,
  type SiteSeo,
} from "@rinads/cms";
import { siteBrand } from "@/lib/brand";
import { getWebsiteCmsClient } from "@/lib/cms-client";
import { buildOrganizationJsonLd, buildWebPageJsonLd } from "@/lib/json-ld";

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

async function loadPublishedBlogPosts() {
  const client = await getWebsiteCmsClient();
  return listBlogPosts(client, false);
}

async function loadBlogPost(slug: string, includeDrafts: boolean) {
  const client = await getWebsiteCmsClient();
  return getBlogPostBySlug(client, slug, includeDrafts);
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

export const getCachedBlogIndex = unstable_cache(loadPublishedBlogPosts, ["cms-blog-index"], {
  tags: ["cms"],
});

export const getCachedBlogPost = unstable_cache(
  async (slug: string) => loadBlogPost(slug, false),
  ["cms-blog-post"],
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

export async function getBlogIndex(): Promise<SiteBlogPost[]> {
  return getCachedBlogIndex();
}

/**
 * Fetch a single blog post. When `preview` is true (a verified draft preview),
 * draft posts are included and the cache is bypassed so editors always see the
 * latest unpublished content. Otherwise only published posts are served, from
 * the cached read path.
 */
export async function getBlogPost(
  slug: string,
  options: { preview?: boolean } = {}
): Promise<SiteBlogPost | null> {
  if (options.preview) {
    return loadBlogPost(slug, true);
  }
  return getCachedBlogPost(slug);
}
