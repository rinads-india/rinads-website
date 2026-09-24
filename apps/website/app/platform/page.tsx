import type { Metadata } from "next";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { getPageMetadata } from "@/lib/cms";
import { PlatformClient } from "./PlatformClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/platform");
}

export default function PlatformPage() {
  return (
    <>
      <CommercialJsonLd
        path="/platform"
        includeSoftwareApplication
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Platform", path: "/platform" },
        ]}
      />
      <PlatformClient />
    </>
  );
}
