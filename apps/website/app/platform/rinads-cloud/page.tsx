import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { CloudClient } from "./CloudClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/platform/rinads-cloud");
}

export default function Page() {
  return <CloudClient />;
}
