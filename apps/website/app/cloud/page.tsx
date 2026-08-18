import type { Metadata } from "next";
import Script from "next/script";
import { CloudClient } from "./CloudClient";
import { getCachedSeoByPath, getPageMetadata, getWebPageJsonLd } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/cloud");
}

export default async function CloudPage() {
  const seo = await getCachedSeoByPath("/cloud");
  const jsonLd = getWebPageJsonLd("/cloud", seo);

  return (
    <>
      <Script
        id="cloud-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CloudClient />
    </>
  );
}
