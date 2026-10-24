import type { Metadata } from "next";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { SolutionsClient } from "./SolutionsClient";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Industry RINASPACES | RINADS",
    description:
      "Explore Industry RINASPACES configured on the shared RINADS platform core, including salon, jewellery, automotive, landscape, retail, logistics, and custom industry workflows.",
  };
}

export default function SolutionsPage() {
  return (
    <>
      <CommercialJsonLd
        path="/solutions"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Industry RINASPACES", path: "/solutions" },
        ]}
      />
      <SolutionsClient />
    </>
  );
}
