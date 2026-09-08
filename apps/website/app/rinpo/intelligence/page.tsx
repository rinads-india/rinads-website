import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { RinpoIntelligenceClient } from "./RinpoIntelligenceClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/rinpo/intelligence");
}

export default function Page() {
  return <RinpoIntelligenceClient />;
}
