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
        "The AI Operating Platform for Business — run, build, grow, learn, and automate with RINPO.",
      offers: {
        "@type": "Offer",
        url: "https://www.rinads.com/signup",
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
