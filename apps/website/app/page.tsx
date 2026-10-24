import Script from "next/script";
import {
  buildOrganizationJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebPageJsonLd,
  buildWebSiteJsonLd,
  serializeJsonLd,
} from "@/lib/json-ld";
import { HomeClient } from "./HomeClient";

const HOME_TITLE = "RINADS | Business Intelligence Platform";
const HOME_DESCRIPTION =
  "Run customers, work, commerce, growth and automation through RINADS Intelligence, RINPO, RINPO Runtime, RI ID, RI SPACE, and connected Industry RINASPACES.";

export async function generateMetadata() {
  return {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  };
}

export default async function HomePage() {
  const jsonLd = [
    buildOrganizationJsonLd(),
    buildWebSiteJsonLd(),
    buildWebPageJsonLd({
      path: "/",
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
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
