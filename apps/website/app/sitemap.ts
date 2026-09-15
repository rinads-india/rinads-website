import type { MetadataRoute } from "next";
import { getCachedPublishedPaths } from "@/lib/cms";
import { OS_SLUGS } from "@/lib/content/platform-os";
import { ACADEMY_PROGRAMS } from "@/lib/content/academy";
import { VERTICALS } from "@/lib/content/verticals";
import { SERVICE_LINES } from "@/lib/content/services";

const STATIC_PATHS = [
  "/",
  "/platform",
  ...OS_SLUGS.map((slug) => `/platform/${slug}`),
  "/rinpo",
  "/rinpo/intelligence",
  "/rinpo/story",
  "/rinpo/voice",
  "/rinpo/phone",
  "/academy",
  ...ACADEMY_PROGRAMS.map((p) => `/academy/${p.slug}`),
  "/solutions",
  ...VERTICALS.map((v) => `/solutions/${v.slug}`),
  "/services",
  ...SERVICE_LINES.map((s) => `/services/${s.slug}`),
  "/resources",
  "/company",
  "/company/privacy",
  "/company/terms",
  "/company/cookies",
  "/projects",
  "/contact",
  "/story-concept",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rinads.com";
  const published = await getCachedPublishedPaths();

  const merged = new Map<string, Date>();
  for (const row of published) {
    merged.set(row.path, new Date(row.updatedAt));
  }
  for (const path of STATIC_PATHS) {
    if (!merged.has(path)) {
      merged.set(path, new Date());
    }
  }

  return Array.from(merged.entries()).map(([path, lastModified]) => ({
    url: `${siteUrl}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "weekly",
    priority: path === "/" ? 1 : path.startsWith("/platform") || path === "/rinpo" ? 0.9 : 0.7,
  }));
}
