import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { VoiceClient } from "./VoiceClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/rinpo/voice");
}

export default function Page() {
  return <VoiceClient />;
}
