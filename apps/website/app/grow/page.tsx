import type { Metadata } from "next";
import Script from "next/script";
import { GrowClient } from "./GrowClient";
import { getCachedSeoByPath, getPageMetadata, getWebPageJsonLd } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/grow");
}

export default async function GrowPage() {
  const seo = await getCachedSeoByPath("/grow");
  const jsonLd = getWebPageJsonLd("/grow", seo);

  return (
    <>
      <Script
        id="grow-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GrowClient />
    </>
  );
}
