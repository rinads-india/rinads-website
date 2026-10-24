import type { Metadata } from "next";
import { AcademyRouteClient } from "./AcademyRouteClient";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";

const PATH = "/resources/academy";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "RI LABS | Learn, Build and Prove with RINADS",
    description:
      "RI LABS connects learning, practical work, RINPO Tutor, real projects, and evidence so people can build capabilities inside the RINADS ecosystem.",
  };
}

export default function ResourcesAcademyPage() {
  return (
    <>
      <CommercialJsonLd
        path={PATH}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
          { name: "RI LABS", path: PATH },
        ]}
      />
      <AcademyRouteClient />
    </>
  );
}
