import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { VerticalSolutionPage } from "@/components/system/VerticalSolutionPage";
import { getVertical } from "@/lib/content/verticals";
import { getSolutionExperience } from "@/lib/solution-experience";
import { metadataFromRegistry } from "@/lib/route-registry";

const PATH = "/solutions/landscape";
const CONTENT_SLUG = "nursery";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "Landscape & Nursery | RINADS" };
}

export default function LandscapeSolutionPage() {
  const vertical = getVertical(CONTENT_SLUG);
  if (!vertical) notFound();
  const experience = getSolutionExperience(CONTENT_SLUG);
  const label = experience?.publicName ?? vertical.name;
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: "Solutions", path: "/solutions" },
    { name: label, path: PATH },
  ];

  return (
    <>
      <CommercialJsonLd path={PATH} breadcrumbs={breadcrumbs} />
      <VerticalSolutionPage vertical={vertical} breadcrumbs={breadcrumbs} />
    </>
  );
}
