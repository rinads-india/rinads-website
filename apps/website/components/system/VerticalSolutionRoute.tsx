import { notFound } from "next/navigation";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { VerticalSolutionPage } from "@/components/system/VerticalSolutionPage";
import { getVertical } from "@/lib/content/verticals";
import { getSolutionExperience } from "@/lib/solution-experience";
import { solutionBreadcrumbs } from "@/lib/marketing-breadcrumbs";

export function VerticalSolutionRoute({ slug }: { slug: string }) {
  const vertical = getVertical(slug);
  if (!vertical) notFound();
  const experience = getSolutionExperience(slug);
  const label = experience?.publicName ?? vertical.name;
  const breadcrumbs = solutionBreadcrumbs(label, vertical.slug);
  const path = `/solutions/${slug}`;

  return (
    <>
      <CommercialJsonLd path={path} breadcrumbs={breadcrumbs} />
      <VerticalSolutionPage vertical={vertical} breadcrumbs={breadcrumbs} />
    </>
  );
}
