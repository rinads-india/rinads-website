import type { Metadata } from "next";
import Script from "next/script";
import { ServicesClient } from "./ServicesClient";
import { getCachedSeoByPath, getPageMetadata, getWebPageJsonLd } from "@/lib/cms";
import { listPlatformServices } from "@/lib/services/catalog";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/services");
}

export default async function ServicesPage() {
  const seo = await getCachedSeoByPath("/services");
  const jsonLd = getWebPageJsonLd("/services", seo);
  const catalog = await listPlatformServices();

  return (
    <>
      <Script
        id="services-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ServicesClient catalog={catalog} />
    </>
  );
}
