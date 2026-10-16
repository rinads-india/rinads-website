import type { Metadata } from "next";
import { PlatformPillarPage } from "@/components/system/PlatformPillarPage";
import { pillarBulletsFromOs, pillarFromCatalog } from "@/lib/content/platform-pillars";
import { getOsPage } from "@/lib/content/platform-os";
import { metadataFromRegistry } from "@/lib/route-registry";

const PATH = "/platform/automation";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "Automation | RINADS" };
}

export default function AutomationPillarPage() {
  const product = pillarFromCatalog("automation");
  const os = getOsPage("automation-os");
  const logistics = getOsPage("logistics-os");
  if (!product || !os) return null;

  const bullets = [
    ...pillarBulletsFromOs("automation-os"),
    ...(logistics
      ? [`Logistics — ${logistics.summary}`]
      : []),
  ];

  return (
    <PlatformPillarPage
      path={PATH}
      eyebrow="Automation"
      title={product.name}
      headline={os.headline}
      summary={os.summary}
      status={product.status}
      bullets={bullets}
      related={[
        { label: "RINPO Runtime", href: "/platform/rinpo-runtime" },
        { label: "RINADS Intelligence", href: "/platform/intelligence" },
        { label: "Integrations", href: "/integrations" },
      ]}
    />
  );
}
