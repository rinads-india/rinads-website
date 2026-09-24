import type { Metadata } from "next";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { getPageMetadata } from "@/lib/cms";
import { SolutionsClient } from "./SolutionsClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/solutions");
}

export default function SolutionsPage() {
  return (
    <>
      <CommercialJsonLd
        path="/solutions"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Solutions", path: "/solutions" },
        ]}
      />
      <SolutionsClient />
    </>
  );
}
