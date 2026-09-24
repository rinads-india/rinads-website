import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rinads.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated app surfaces, checkout, tracking, concept/demo-only paths,
      // and API routes are not public marketing content.
      disallow: [
        "/os",
        "/signup",
        "/onboarding",
        "/services/checkout",
        "/track",
        "/rinaglow",
        "/story-concept",
        "/api",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
