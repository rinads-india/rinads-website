import type { Metadata } from "next";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { metadataFromRegistry } from "@/lib/route-registry";
import { AcademyClient } from "@/app/academy/AcademyClient";

const PATH = "/labs";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "RI LABS | RINADS" };
}

export default function LabsPage() {
  return (
    <>
      <CommercialJsonLd
        path={PATH}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "RI LABS", path: PATH },
        ]}
      />
      <AcademyClient />
    </>
  );
}
