import type { SiteMedia, SitePage, SiteRedirect, SiteSeo } from "./types";

type Row = Record<string, unknown>;

export function mapSitePageRow(row: Row, sections: Record<string, unknown> = {}): SitePage {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    layoutKey: String(row.layout_key ?? "default"),
    status: row.status as SitePage["status"],
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    sections,
  };
}

export function mapSiteSeoRow(row: Row): SiteSeo {
  return {
    id: String(row.id),
    path: String(row.path),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    ogTitle: row.og_title ? String(row.og_title) : undefined,
    ogDescription: row.og_description ? String(row.og_description) : undefined,
    ogImageUrl: row.og_image_url ? String(row.og_image_url) : undefined,
    robotsIndex: Boolean(row.robots_index ?? true),
    robotsFollow: Boolean(row.robots_follow ?? true),
    canonicalUrl: row.canonical_url ? String(row.canonical_url) : undefined,
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export function mapSiteRedirectRow(row: Row): SiteRedirect {
  return {
    id: String(row.id),
    fromPath: String(row.from_path),
    toPath: String(row.to_path),
    permanent: Boolean(row.permanent ?? true),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function mapSiteMediaRow(row: Row): SiteMedia {
  return {
    id: String(row.id),
    storagePath: String(row.storage_path),
    publicUrl: String(row.public_url),
    altText: String(row.alt_text ?? ""),
    mimeType: String(row.mime_type ?? "image/png"),
    width: row.width != null ? Number(row.width) : undefined,
    height: row.height != null ? Number(row.height) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export function seoToDbRow(input: Omit<SiteSeo, "id" | "updatedAt">) {
  return {
    path: input.path,
    title: input.title,
    description: input.description,
    og_title: input.ogTitle ?? null,
    og_description: input.ogDescription ?? null,
    og_image_url: input.ogImageUrl ?? null,
    robots_index: input.robotsIndex,
    robots_follow: input.robotsFollow,
    canonical_url: input.canonicalUrl ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function redirectToDbRow(input: Omit<SiteRedirect, "id" | "createdAt">) {
  return {
    from_path: input.fromPath,
    to_path: input.toPath,
    permanent: input.permanent,
  };
}

export function mediaToDbRow(input: Omit<SiteMedia, "id" | "createdAt">) {
  return {
    storage_path: input.storagePath,
    public_url: input.publicUrl,
    alt_text: input.altText,
    mime_type: input.mimeType,
    width: input.width ?? null,
    height: input.height ?? null,
  };
}
