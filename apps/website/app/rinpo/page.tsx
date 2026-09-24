import type { Metadata } from "next";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { getPageMetadata } from "@/lib/cms";
import { RinpoClient } from "./RinpoClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/rinpo");
}

export default function RinpoPage() {
  return (
    <>
      <CommercialJsonLd
        path="/rinpo"
        includeSoftwareApplication
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "RINPO", path: "/rinpo" },
        ]}
      />
      <RinpoClient />
    </>
  );
}
