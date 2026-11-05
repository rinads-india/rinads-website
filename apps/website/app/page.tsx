import Script from "next/script";
import { getCachedSeoByPath, getPageMetadata } from "@/lib/cms";
import {
  buildOrganizationJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebPageJsonLd,
  buildWebSiteJsonLd,
  serializeJsonLd,
} from "@/lib/json-ld";
import { HomeClient } from "./HomeClient";

export async function generateMetadata() {
  return getPageMetadata("/");
}

export default async function HomePage() {
  const seo = await getCachedSeoByPath("/");
  const jsonLd = [
    buildOrganizationJsonLd(),
    buildWebSiteJsonLd(),
    buildWebPageJsonLd({
      path: "/",
      title: seo?.title ?? "RINADS | Business, simplified.",
      description:
        seo?.description ??
        "Run, sell, grow and automate your business from one intelligent platform with RINPO. Business Intelligence Platform for growing businesses.",
    }),
    buildSoftwareApplicationJsonLd(),
  ];

  return (
    <>
      <Script
        id="home-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
