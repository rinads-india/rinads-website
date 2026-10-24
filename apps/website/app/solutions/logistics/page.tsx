import type { Metadata } from "next";
import { VerticalSolutionRoute } from "@/components/system/VerticalSolutionRoute";

const SLUG = "logistics";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "RI LOGISTICS | RINADS",
    description:
      "Provider-neutral logistics operations for shipments, carriers, tracking, returns, delivery exceptions, and governed execution through the RINADS platform.",
  };
}

export default function Page() {
  return <VerticalSolutionRoute slug={SLUG} />;
}
