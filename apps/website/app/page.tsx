import Script from "next/script";
import { getCachedSeoByPath, getOrganizationJsonLd, getPageMetadata, getWebPageJsonLd } from "@/lib/cms";
import { HomeClient } from "./HomeClient";

export async function generateMetadata() {
  return getPageMetadata("/");
}

export default async function HomePage() {
  const seo = await getCachedSeoByPath("/");
  const jsonLd = [
    getOrganizationJsonLd(),
    getWebPageJsonLd("/", seo),
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "RINADS",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "AI operating platform for growing businesses — run customers, work, commerce, marketing and automation with RINPO.",
      offers: {
        "@type": "Offer",
        url: "https://www.rinads.com/contact?intent=demo",
      },
    },
  ];

  return (
    <>
      <Script
        id="home-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
