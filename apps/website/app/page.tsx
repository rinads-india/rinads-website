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
      title: seo?.title ?? "RINADS | Business Intelligence Infrastructure",
      description:
        seo?.description ??
        "Business Intelligence Infrastructure for Software-Defined Business. Powered by RINADS INTELLIGENCE. Executed by RINPO RUNTIME.",
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
