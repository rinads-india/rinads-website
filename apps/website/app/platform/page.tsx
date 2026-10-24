import type { Metadata } from "next";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { PlatformClient } from "./PlatformClient";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "RINADS | Business Intelligence Platform",
    description:
      "Explore RINADS Intelligence, RINPO, RINPO Runtime, RI ID, RI SPACE, connected business capabilities, and Industry RINASPACES on one governed platform.",
  };
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
