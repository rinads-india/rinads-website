import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { RinpoStoryClient } from "@/app/rinpo-story/RinpoStoryClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/rinpo/story");
}

export default function RinpoStoryPage() {
  return <RinpoStoryClient />;
}
