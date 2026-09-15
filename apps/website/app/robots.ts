import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rinads.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated app surfaces, checkout, order tracking, and any
      // future embedded vertical apps (e.g. /rinaglow) are not public
      // marketing content and must never be indexed.
      disallow: ["/os", "/services/checkout", "/track", "/rinaglow"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
