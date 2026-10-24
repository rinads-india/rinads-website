import type { Metadata } from "next";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { CloudRouteClient } from "./CloudRouteClient";

const PATH = "/platform/cloud";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "RI ID + RI SPACE | RINADS",
    description:
      "One identity and one persistent business workspace, backed by the shared RINADS platform core and governed RINPO Runtime.",
  };
}

export default function CloudPillarPage() {
  return (
    <>
      <CommercialJsonLd
        path={PATH}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Platform", path: "/platform" },
          { name: "RI ID + RI SPACE", path: PATH },
        ]}
      />
      <CloudRouteClient />
    </>
  );
}
