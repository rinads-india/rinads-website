import type { MetadataRoute } from "next";
import { getCachedPublishedPaths } from "@/lib/cms";

const STATIC_PATHS = ["/services", "/rinads-cloud", "/contact", "/story-concept"];

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
    changeFrequency: path === "" || path === "/" ? "weekly" : "weekly",
    priority: path === "" || path === "/" ? 1 : 0.7,
  }));
}
