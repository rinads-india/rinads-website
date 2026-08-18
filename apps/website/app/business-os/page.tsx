import type { Metadata } from "next";
import Script from "next/script";
import { BusinessOsClient } from "./BusinessOsClient";
import { getCachedSeoByPath, getPageMetadata, getWebPageJsonLd } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/business-os");
}

export default async function BusinessOsPage() {
  const seo = await getCachedSeoByPath("/business-os");
  const jsonLd = getWebPageJsonLd("/business-os", seo);

  return (
    <>
      <Script
        id="business-os-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BusinessOsClient />
    </>
  );
}
