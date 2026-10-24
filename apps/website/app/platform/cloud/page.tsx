import type { Metadata } from "next";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { CloudRouteClient } from "./CloudRouteClient";
import { metadataFromRegistry } from "@/lib/route-registry";

const PATH = "/platform/cloud";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "RI ID + RI SPACE | RINADS" };
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
