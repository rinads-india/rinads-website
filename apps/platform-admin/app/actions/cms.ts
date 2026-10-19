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
import {
  buildCmsMediaStoragePath,
  resolveCmsMediaBucket,
  validateCmsMediaUpload,
} from "@rinads/cms/media-upload";
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
    const row = await saveMedia(getCmsClient(), input);
    bumpCmsCache();
    return { ok: true as const, row };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to register media" };
  }
}

/**
 * Upload a file to Supabase Storage (`rinads-cms` bucket) and register a
 * `site_media` row. In demo mode (or when Storage is unavailable) stores a
 * data-URL fallback so the admin UI remains usable without founder-gated infra.
 */
export async function uploadCmsMediaAction(formData: FormData) {
  try {
    await requirePlatformTenancy();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { ok: false as const, error: "Choose an image file to upload." };
    }
    const altText = String(formData.get("altText") ?? "").trim();
    const validation = validateCmsMediaUpload({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (!validation.ok) {
      return { ok: false as const, error: validation.error };
    }

    const storagePath = buildCmsMediaStoragePath({
      fileName: validation.fileName,
      mimeType: validation.mimeType,
    });
    const bytes = new Uint8Array(await file.arrayBuffer());

    let publicUrl: string | null = null;
    let usedDemoFallback = false;

    if (!isDemoMode()) {
      try {
        const supabase = createPlatformServiceClient();
        const bucket = resolveCmsMediaBucket();
        const upload = await supabase.storage.from(bucket).upload(storagePath, bytes, {
          contentType: validation.mimeType,
          upsert: false,
        });
        if (upload.error) {
          return { ok: false as const, error: upload.error.message };
        }
        const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
        publicUrl = data.publicUrl;
      } catch (error) {
        return {
          ok: false as const,
          error: error instanceof Error ? error.message : "Storage upload failed",
        };
      }
    }

    if (!publicUrl) {
      // Demo / no-storage path: keep the asset viewable in the admin grid.
      const base64 = Buffer.from(bytes).toString("base64");
      publicUrl = `data:${validation.mimeType};base64,${base64}`;
      usedDemoFallback = true;
    }

    const row = await saveMedia(getCmsClient(), {
      storagePath: usedDemoFallback ? `demo/${storagePath}` : storagePath,
      publicUrl,
      altText,
      mimeType: validation.mimeType,
    });
    bumpCmsCache();
    return { ok: true as const, row, demoFallback: usedDemoFallback };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to upload media" };
  }
}
