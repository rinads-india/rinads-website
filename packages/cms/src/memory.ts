import { createDefaultCmsStore } from "./defaults";
import type { CmsStore, SiteMedia, SitePage, SitePageStatus, SiteRedirect, SiteSeo } from "./types";

let sharedStore: CmsStore | null = null;

export function getSharedCmsStore(): CmsStore {
  if (!sharedStore) {
    sharedStore = createDefaultCmsStore();
  }
  return sharedStore;
}

export function resetCmsStore() {
  sharedStore = createDefaultCmsStore();
}

function touchPage(page: SitePage) {
  page.updatedAt = new Date().toISOString();
}

export function listPagesFromMemory(includeDrafts = true): SitePage[] {
  const store = getSharedCmsStore();
  return store.pages
    .filter((page) => includeDrafts || page.status === "published")
    .map((page) => ({
      ...page,
      sections: { ...page.sections },
    }));
}

export function getPageBySlugFromMemory(slug: string, includeDrafts = false): SitePage | null {
  const page = getSharedCmsStore().pages.find((row) => row.slug === slug);
  if (!page) return null;
  if (!includeDrafts && page.status !== "published") return null;
  return { ...page, sections: { ...page.sections } };
}

export function listSeoFromMemory(): SiteSeo[] {
  return getSharedCmsStore().seo.map((row) => ({ ...row }));
}

export function getSeoByPathFromMemory(path: string): SiteSeo | null {
  const normalized = path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;
  return getSharedCmsStore().seo.find((row) => row.path === normalized) ?? null;
}

export function listRedirectsFromMemory(): SiteRedirect[] {
  return getSharedCmsStore().redirects.map((row) => ({ ...row }));
}

export function listMediaFromMemory(): SiteMedia[] {
  return getSharedCmsStore().media.map((row) => ({ ...row }));
}

export function upsertSeoInMemory(input: Omit<SiteSeo, "id" | "updatedAt"> & { id?: string }) {
  const store = getSharedCmsStore();
  const normalized = input.path === "" ? "/" : input.path.startsWith("/") ? input.path : `/${input.path}`;
  const existing = store.seo.find((row) => row.path === normalized);
  const next: SiteSeo = {
    id: existing?.id ?? input.id ?? `seo_${normalized.replace(/\//g, "_") || "root"}`,
    path: normalized,
    title: input.title,
    description: input.description,
    ogTitle: input.ogTitle,
    ogDescription: input.ogDescription,
    ogImageUrl: input.ogImageUrl,
    robotsIndex: input.robotsIndex,
    robotsFollow: input.robotsFollow,
    canonicalUrl: input.canonicalUrl,
    updatedAt: new Date().toISOString(),
  };
  if (existing) {
    Object.assign(existing, next);
    return next;
  }
  store.seo.push(next);
  return next;
}

export function updatePageStatusInMemory(slug: string, status: SitePageStatus) {
  const page = getSharedCmsStore().pages.find((row) => row.slug === slug);
  if (!page) return null;
  page.status = status;
  touchPage(page);
  return page;
}

export function upsertPageSectionInMemory(slug: string, sectionKey: string, content: unknown) {
  const page = getSharedCmsStore().pages.find((row) => row.slug === slug);
  if (!page) return null;
  page.sections[sectionKey] = content;
  touchPage(page);
  return page;
}

export function upsertRedirectInMemory(input: Omit<SiteRedirect, "id" | "createdAt"> & { id?: string }) {
  const store = getSharedCmsStore();
  const existing = store.redirects.find((row) => row.fromPath === input.fromPath);
  const next: SiteRedirect = {
    id: existing?.id ?? input.id ?? `redirect_${Date.now()}`,
    fromPath: input.fromPath,
    toPath: input.toPath,
    permanent: input.permanent,
    createdAt: new Date().toISOString(),
  };
  if (existing) {
    Object.assign(existing, next);
    return next;
  }
  store.redirects.push(next);
  return next;
}

export function deleteRedirectInMemory(id: string) {
  const store = getSharedCmsStore();
  store.redirects = store.redirects.filter((row) => row.id !== id);
}

export function addMediaInMemory(input: Omit<SiteMedia, "id" | "createdAt"> & { id?: string }) {
  const store = getSharedCmsStore();
  const next: SiteMedia = {
    id: input.id ?? `media_${Date.now()}`,
    storagePath: input.storagePath,
    publicUrl: input.publicUrl,
    altText: input.altText,
    mimeType: input.mimeType,
    width: input.width,
    height: input.height,
    createdAt: new Date().toISOString(),
  };
  store.media.unshift(next);
  return next;
}

export function listPublishedPathsFromMemory(): { path: string; updatedAt: string }[] {
  const store = getSharedCmsStore();
  const pagePaths = store.pages
    .filter((page) => page.status === "published")
    .map((page) => ({
      path: page.slug === "home" ? "/" : `/${page.slug}`,
      updatedAt: page.updatedAt,
    }));
  const seoPaths = store.seo
    .filter((row) => row.robotsIndex)
    .map((row) => ({ path: row.path, updatedAt: row.updatedAt }));
  const merged = new Map<string, string>();
  for (const row of [...pagePaths, ...seoPaths]) {
    merged.set(row.path, row.updatedAt);
  }
  return Array.from(merged.entries()).map(([path, updatedAt]) => ({ path, updatedAt }));
}
