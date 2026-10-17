import type { Metadata } from "next";
import { metadataFromRegistry } from "@/lib/route-registry";
import { LiveClient } from "./LiveClient";

export async function generateMetadata(): Promise<Metadata> {
  return (
    (metadataFromRegistry("/rinpo/live") as Metadata) ?? { title: "RINPO Live | RINADS" }
  );
}

export default function Page() {
  return <LiveClient />;
}
