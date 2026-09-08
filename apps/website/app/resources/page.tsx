import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { ResourcesClient } from "./ResourcesClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/resources");
}

export default function ResourcesPage() {
  return <ResourcesClient />;
}
