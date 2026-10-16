import type { Metadata } from "next";
import { SecurityMarketingPage } from "@/components/system/SecurityMarketingPage";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/security") as Metadata) ?? { title: "Security | RINADS" };
}

export default function SecurityPage() {
  return <SecurityMarketingPage path="/trust/security" />;
}
