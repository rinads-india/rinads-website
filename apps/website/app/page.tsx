import Script from "next/script";
import { getCachedSeoByPath, getOrganizationJsonLd, getPageMetadata, getWebPageJsonLd } from "@/lib/cms";
import { HomeClient } from "./HomeClient";

export async function generateMetadata() {
  return getPageMetadata("/");
}

export default async function HomePage() {
  const seo = await getCachedSeoByPath("/");
  const jsonLd = [getOrganizationJsonLd(), getWebPageJsonLd("/", seo)];

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
