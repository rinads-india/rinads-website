import type { Metadata } from "next";
import Script from "next/script";
import { RinpoIntelligenceClient } from "./RinpoIntelligenceClient";
import { getCachedSeoByPath, getPageMetadata, getWebPageJsonLd } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/rinpo-intelligence");
}

export default async function RinpoIntelligencePage() {
  const seo = await getCachedSeoByPath("/rinpo-intelligence");
  const jsonLd = getWebPageJsonLd("/rinpo-intelligence", seo);

  return (
    <>
      <Script
        id="rinpo-intelligence-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RinpoIntelligenceClient />
    </>
  );
}
