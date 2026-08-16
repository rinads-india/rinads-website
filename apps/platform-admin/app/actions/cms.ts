"use server";

import {
  listMedia,
  listPages,
  listRedirects,
  listSeo,
  removeRedirect,
  saveMedia,
  savePageSection,
  savePageStatus,
  saveRedirect,
  saveSeo,
  type CmsSupabaseClient,
  type SitePageStatus,
} from "@rinads/cms";
import { createPlatformServiceClient } from "@/lib/supabase/server";
import { requirePlatformTenancy } from "@/lib/tenancy";
import { isDemoMode } from "@/lib/supabase/env";

function getCmsClient(): CmsSupabaseClient | null {
  if (isDemoMode()) return null;
  try {
    return createPlatformServiceClient() as unknown as CmsSupabaseClient;
  } catch {
    return null;
  }
}

async function bumpCmsCache() {
  const url = process.env.WEBSITE_REVALIDATE_URL;
  const secret = process.env.CMS_REVALIDATE_SECRET;
  if (!url || !secret) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
    });
  } catch {
    // Website cache revalidation is best-effort when URL is configured.
  }
}

export async function listCmsPagesAction() {
  try {
    await requirePlatformTenancy();
    const pages = await listPages(getCmsClient(), true);
    return { ok: true as const, pages };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to load pages" };
  }
}

export async function updateCmsPageStatusAction(slug: string, status: SitePageStatus) {
  try {
    await requirePlatformTenancy();
    await savePageStatus(getCmsClient(), slug, status);
    bumpCmsCache();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to update page" };
  }
}

export async function saveCmsPageSectionAction(slug: string, sectionKey: string, contentJson: string) {
  try {
    await requirePlatformTenancy();
    const content = JSON.parse(contentJson) as unknown;
    await savePageSection(getCmsClient(), slug, sectionKey, content);
    bumpCmsCache();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to save section" };
  }
}

export async function listCmsSeoAction() {
  try {
    await requirePlatformTenancy();
    const rows = await listSeo(getCmsClient());
    return { ok: true as const, rows };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to load SEO" };
  }
}

export async function saveCmsSeoAction(input: {
  path: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  canonicalUrl?: string;
}) {
  try {
    await requirePlatformTenancy();
    await saveSeo(getCmsClient(), input);
    bumpCmsCache();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to save SEO" };
  }
}

export async function listCmsRedirectsAction() {
  try {
    await requirePlatformTenancy();
    const rows = await listRedirects(getCmsClient());
    return { ok: true as const, rows };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to load redirects" };
  }
}

export async function saveCmsRedirectAction(input: {
  fromPath: string;
  toPath: string;
  permanent: boolean;
}) {
  try {
    await requirePlatformTenancy();
    await saveRedirect(getCmsClient(), input);
    bumpCmsCache();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to save redirect" };
  }
}

export async function deleteCmsRedirectAction(id: string) {
  try {
    await requirePlatformTenancy();
    await removeRedirect(getCmsClient(), id);
    bumpCmsCache();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to delete redirect" };
  }
}

export async function listCmsMediaAction() {
  try {
    await requirePlatformTenancy();
    const rows = await listMedia(getCmsClient());
    return { ok: true as const, rows };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to load media" };
  }
}

export async function registerCmsMediaAction(input: {
  storagePath: string;
  publicUrl: string;
  altText: string;
  mimeType: string;
}) {
  try {
    await requirePlatformTenancy();
    await saveMedia(getCmsClient(), input);
    bumpCmsCache();
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to register media" };
  }
}
