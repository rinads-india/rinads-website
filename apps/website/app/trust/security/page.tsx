import type { Metadata } from "next";
import { SecurityMarketingPage } from "@/components/system/SecurityMarketingPage";
import { metadataFromRegistry } from "@/lib/route-registry";

const PATH = "/trust/security";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "Security | RINADS" };
}

export default function TrustSecurityPage() {
  return <SecurityMarketingPage path={PATH} />;
}
