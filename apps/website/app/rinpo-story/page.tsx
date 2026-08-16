import type { Metadata } from "next";
import { RinpoStoryClient } from "./RinpoStoryClient";
import { getPageMetadata } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/rinpo-story");
}

export default function RinpoStoryPage() {
  return <RinpoStoryClient />;
}
