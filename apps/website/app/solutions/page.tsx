import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { SolutionsClient } from "./SolutionsClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/solutions");
}

export default function SolutionsPage() {
  return <SolutionsClient />;
}
