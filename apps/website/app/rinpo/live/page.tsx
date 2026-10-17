import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { LiveClient } from "./LiveClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/rinpo/live");
}

export default function Page() {
  return <LiveClient />;
}
