import type { Metadata } from "next";
import { AcademyRouteClient } from "./AcademyRouteClient";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { metadataFromRegistry } from "@/lib/route-registry";

const PATH = "/resources/academy";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "Academy | RINADS" };
}

export default function ResourcesAcademyPage() {
  return (
    <>
      <CommercialJsonLd
        path={PATH}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
          { name: "Academy", path: PATH },
        ]}
      />
      <AcademyRouteClient />
    </>
  );
}
