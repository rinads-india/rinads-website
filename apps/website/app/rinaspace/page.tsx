import type { Metadata } from "next";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { metadataFromRegistry } from "@/lib/route-registry";
import { SolutionsClient } from "@/app/solutions/SolutionsClient";

const PATH = "/rinaspace";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "Industry RINASPACES | RINADS" };
}

export default function RinaspacePage() {
  return (
    <>
      <CommercialJsonLd
        path={PATH}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Industry RINASPACES", path: PATH },
        ]}
      />
      <SolutionsClient />
    </>
  );
}
