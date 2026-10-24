import type { Metadata } from "next";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { RinpoClient } from "./RinpoClient";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "RINPO | Business Intelligence Character by RINADS",
    description:
      "Meet RINPO, the persistent Business Intelligence Character for RINADS, with governed execution through RINPO Runtime where supported by tools, permissions, approvals, and audit controls.",
  };
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
