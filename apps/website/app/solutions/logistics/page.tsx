import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { VerticalSolutionRoute } from "@/components/system/VerticalSolutionRoute";

const SLUG = "logistics";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata(`/solutions/${SLUG}`);
}

export default function Page() {
  return <VerticalSolutionRoute slug={SLUG} />;
}
