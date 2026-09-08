import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { PlatformClient } from "./PlatformClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/platform");
}

export default function PlatformPage() {
  return <PlatformClient />;
}
