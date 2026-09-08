import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageMetadata } from "@/lib/cms";
import { getVertical } from "@/lib/content/verticals";
import { VerticalSolutionPage } from "@/components/system/VerticalSolutionPage";

const SLUG = "salon";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(`/solutions/${SLUG}`);
}

export default function Page() {
  const vertical = getVertical(SLUG);
  if (!vertical) notFound();
  return <VerticalSolutionPage vertical={vertical} />;
}
