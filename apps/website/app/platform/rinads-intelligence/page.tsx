import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { IntelligenceClient } from "./IntelligenceClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/platform/rinads-intelligence");
}

export default function Page() {
  return <IntelligenceClient />;
}
