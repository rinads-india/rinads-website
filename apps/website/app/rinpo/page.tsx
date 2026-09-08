import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { RinpoClient } from "./RinpoClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/rinpo");
}

export default function RinpoPage() {
  return <RinpoClient />;
}
