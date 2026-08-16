import {
  getDefaultAbout,
  getDefaultSeoForPath,
  getDefaultServiceCards,
} from "./defaults";
import {
  addMediaInMemory,
  deleteRedirectInMemory,
  getPageBySlugFromMemory,
  getSeoByPathFromMemory,
  listMediaFromMemory,
  listPagesFromMemory,
  listPublishedPathsFromMemory,
  listRedirectsFromMemory,
  listSeoFromMemory,
  updatePageStatusInMemory,
  upsertPageSectionInMemory,
  upsertRedirectInMemory,
  upsertSeoInMemory,
} from "./memory";
import { mapSiteMediaRow, mapSitePageRow, mapSiteRedirectRow, mapSiteSeoRow, mediaToDbRow, redirectToDbRow, seoToDbRow } from "./mappers";
import type { CmsSupabaseClient, CmsSupabaseResult, ServiceCardContent, SiteMedia, SitePage, SitePageStatus, SiteRedirect, SiteSeo } from "./types";

type SupabaseResult<T> = CmsSupabaseResult<T>;

async function loadPageSections(
  client: CmsSupabaseClient,
  pageId: string
): Promise<Record<string, unknown>> {
  const builder = client.from("site_page_sections").select("section_key, content").eq("page_id", pageId);
  const { data, error } = (await builder.order("sort_order", {
    ascending: true,
  })) as SupabaseResult<Array<{ section_key: string; content: unknown }>>;
  if (error || !data) return {};
  return Object.fromEntries(data.map((row) => [row.section_key, row.content]));
}

export async function listPages(
  client: CmsSupabaseClient | null,
  includeDrafts = true
): Promise<SitePage[]> {
  if (!client) return listPagesFromMemory(includeDrafts);
  const builder = client.from("site_pages").select("*");
  const { data, error } = (await builder.order("updated_at", { ascending: false })) as SupabaseResult<
    Array<Record<string, unknown>>
  >;
  if (error || !data) return listPagesFromMemory(includeDrafts);
  const pages: SitePage[] = [];
  for (const row of data) {
    if (!includeDrafts && row.status !== "published") continue;
    const sections = await loadPageSections(client, String(row.id));
    pages.push(mapSitePageRow(row, sections));
  }
  return pages;
}

export async function getPageBySlug(
  client: CmsSupabaseClient | null,
  slug: string,
  includeDrafts = false
): Promise<SitePage | null> {
  if (!client) return getPageBySlugFromMemory(slug, includeDrafts);
  const builder = client.from("site_pages").select("*").eq("slug", slug);
  const { data, error } = await builder.maybeSingle();
  if (error || !data) return getPageBySlugFromMemory(slug, includeDrafts);
  if (!includeDrafts && data.status !== "published") return null;
  const sections = await loadPageSections(client, String(data.id));
  return mapSitePageRow(data, sections);
}

export async function listSeo(client: CmsSupabaseClient | null): Promise<SiteSeo[]> {
  if (!client) return listSeoFromMemory();
  const builder = client.from("site_seo").select("*");
  const { data, error } = (await builder.order("path", { ascending: true })) as SupabaseResult<
    Array<Record<string, unknown>>
  >;
  if (error || !data) return listSeoFromMemory();
  return data.map(mapSiteSeoRow);
}

export async function getSeoByPath(client: CmsSupabaseClient | null, path: string): Promise<SiteSeo | null> {
  const normalized = path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;
  if (!client) return getSeoByPathFromMemory(normalized);
  const builder = client.from("site_seo").select("*").eq("path", normalized);
  const { data, error } = await builder.maybeSingle();
  if (error || !data) return getDefaultSeoForPath(normalized);
  return mapSiteSeoRow(data);
}

export async function listRedirects(client: CmsSupabaseClient | null): Promise<SiteRedirect[]> {
  if (!client) return listRedirectsFromMemory();
  const builder = client.from("site_redirects").select("*");
  const { data, error } = (await builder.order("created_at", { ascending: false })) as SupabaseResult<
    Array<Record<string, unknown>>
  >;
  if (error || !data) return listRedirectsFromMemory();
  return data.map(mapSiteRedirectRow);
}

export async function listMedia(client: CmsSupabaseClient | null): Promise<SiteMedia[]> {
  if (!client) return listMediaFromMemory();
  const builder = client.from("site_media").select("*");
  const { data, error } = (await builder.order("created_at", { ascending: false })) as SupabaseResult<
    Array<Record<string, unknown>>
  >;
  if (error || !data) return listMediaFromMemory();
  return data.map(mapSiteMediaRow);
}

export async function listPublishedPaths(
  client: CmsSupabaseClient | null
): Promise<{ path: string; updatedAt: string }[]> {
  if (!client) return listPublishedPathsFromMemory();
  const pages = await listPages(client, false);
  const seo = await listSeo(client);
  const merged = new Map<string, string>();
  for (const page of pages) {
    merged.set(page.slug === "home" ? "/" : `/${page.slug}`, page.updatedAt);
  }
  for (const row of seo.filter((item) => item.robotsIndex)) {
    merged.set(row.path, row.updatedAt);
  }
  return Array.from(merged.entries()).map(([path, updatedAt]) => ({ path, updatedAt }));
}

export async function saveSeo(client: CmsSupabaseClient | null, input: Omit<SiteSeo, "id" | "updatedAt">) {
  if (!client) return upsertSeoInMemory(input);
  const builder = client.from("site_seo").upsert(seoToDbRow(input), { onConflict: "path" }).select("*");
  const { data, error } = await builder.single();
  if (error || !data) return upsertSeoInMemory(input);
  return mapSiteSeoRow(data);
}

export async function savePageStatus(client: CmsSupabaseClient | null, slug: string, status: SitePageStatus) {
  if (!client) return updatePageStatusInMemory(slug, status);
  const builder = client
    .from("site_pages")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("slug", slug)
    .select("*");
  const { data, error } = await builder.single();
  if (error || !data) return updatePageStatusInMemory(slug, status);
  const sections = await loadPageSections(client, String(data.id));
  return mapSitePageRow(data, sections);
}

export async function savePageSection(
  client: CmsSupabaseClient | null,
  slug: string,
  sectionKey: string,
  content: unknown
) {
  if (!client) return upsertPageSectionInMemory(slug, sectionKey, content);
  const page = await getPageBySlug(client, slug, true);
  if (!page) return upsertPageSectionInMemory(slug, sectionKey, content);
  await client.from("site_page_sections").upsert(
    {
      page_id: page.id,
      section_key: sectionKey,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "page_id,section_key" }
  );
  return upsertPageSectionInMemory(slug, sectionKey, content);
}

export async function saveRedirect(
  client: CmsSupabaseClient | null,
  input: Omit<SiteRedirect, "id" | "createdAt">
) {
  if (!client) return upsertRedirectInMemory(input);
  const builder = client.from("site_redirects").upsert(redirectToDbRow(input), { onConflict: "from_path" }).select("*");
  const { data, error } = await builder.single();
  if (error || !data) return upsertRedirectInMemory(input);
  return mapSiteRedirectRow(data);
}

export async function removeRedirect(client: CmsSupabaseClient | null, id: string) {
  if (!client) {
    deleteRedirectInMemory(id);
    return;
  }
  client.from("site_redirects").delete().eq("id", id);
  deleteRedirectInMemory(id);
}

export async function saveMedia(client: CmsSupabaseClient | null, input: Omit<SiteMedia, "id" | "createdAt">) {
  if (!client) return addMediaInMemory(input);
  const builder = client.from("site_media").insert(mediaToDbRow(input)).select("*");
  const { data, error } = await builder.single();
  if (error || !data) return addMediaInMemory(input);
  return mapSiteMediaRow(data);
}

export function getServiceCardsFromPage(page: SitePage | null): ServiceCardContent[] {
  const content = page?.sections["services.cards"];
  if (Array.isArray(content)) {
    return content as ServiceCardContent[];
  }
  return getDefaultServiceCards();
}

export function getAboutFromPage(page: SitePage | null) {
  const content = page?.sections.about;
  if (content && typeof content === "object") {
    return content as ReturnType<typeof getDefaultAbout>;
  }
  return getDefaultAbout();
}

export function findRedirectForPath(redirects: SiteRedirect[], pathname: string): SiteRedirect | null {
  return redirects.find((row) => row.fromPath === pathname) ?? null;
}
