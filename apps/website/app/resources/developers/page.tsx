import type { Metadata } from "next";
import { DevelopersRouteClient } from "./DevelopersRouteClient";
import { metadataFromRegistry } from "@/lib/route-registry";

const PATH = "/resources/developers";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "Developers | RINADS" };
}

export default function ResourcesDevelopersPage() {
  return <DevelopersRouteClient />;
}
