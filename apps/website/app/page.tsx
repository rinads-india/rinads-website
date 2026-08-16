import Script from "next/script";
import { getCachedSeoByPath, getHomeCmsContent, getOrganizationJsonLd, getPageMetadata, getWebPageJsonLd } from "@/lib/cms";
import { HomeClient } from "./HomeClient";

export async function generateMetadata() {
  return getPageMetadata("/");
}

export default async function HomePage() {
  const [cms, seo] = await Promise.all([getHomeCmsContent(), getCachedSeoByPath("/")]);
  const jsonLd = [getOrganizationJsonLd(), getWebPageJsonLd("/", seo)];

  return (
    <>
      <Script
        id="home-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient cms={cms} />
    </>
  );
}
