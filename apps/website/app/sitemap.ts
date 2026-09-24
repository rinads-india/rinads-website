import type { MetadataRoute } from "next";
import { getCachedPublishedPaths } from "@/lib/cms";
import { ACADEMY_PROGRAMS } from "@/lib/content/academy";
import { VERTICALS } from "@/lib/content/verticals";
import { SERVICE_LINES } from "@/lib/content/services";
import { INTEGRATIONS, getPublishedCaseStudies } from "@/lib/content/case-studies";
import { getIndexableRoutes } from "@/lib/route-registry";

const EXCLUDED_PREFIXES = [
  "/os",
  "/signup",
  "/onboarding",
  "/services/checkout",
  "/track",
  "/rinaglow",
  "/story-concept",
  "/api",
];

function isExcluded(path: string): boolean {
  return EXCLUDED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rinads.com";
  const published = await getCachedPublishedPaths();

  const merged = new Map<string, Date>();

  for (const route of getIndexableRoutes()) {
    if (!isExcluded(route.path)) {
      merged.set(route.path, new Date());
    }
  }

  for (const program of ACADEMY_PROGRAMS) {
    merged.set(`/academy/${program.slug}`, new Date());
  }
  for (const vertical of VERTICALS) {
    merged.set(`/solutions/${vertical.slug}`, new Date());
  }
  for (const line of SERVICE_LINES) {
    merged.set(`/services/${line.slug}`, new Date());
  }
  for (const integration of INTEGRATIONS) {
    merged.set(integration.href, new Date());
  }
  for (const study of getPublishedCaseStudies()) {
    merged.set(`/customers/${study.slug}`, new Date());
  }

  for (const row of published) {
    if (!isExcluded(row.path) && !merged.has(row.path)) {
      // Only add CMS paths that are not already represented; never reintroduce story-concept.
      merged.set(row.path, new Date(row.updatedAt));
    } else if (!isExcluded(row.path) && merged.has(row.path)) {
      merged.set(row.path, new Date(row.updatedAt));
    }
  }

  // Hard exclude story-concept and auth/app surfaces even if CMS lists them.
  for (const path of Array.from(merged.keys())) {
    if (isExcluded(path)) merged.delete(path);
  }

  return Array.from(merged.entries()).map(([path, lastModified]) => ({
    url: `${siteUrl}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "weekly",
    priority: path === "/" ? 1 : path.startsWith("/platform") || path === "/rinpo" ? 0.9 : 0.7,
  }));
}
