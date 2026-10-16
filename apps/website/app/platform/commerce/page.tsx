import type { Metadata } from "next";
import { PlatformPillarPage } from "@/components/system/PlatformPillarPage";
import { pillarBulletsFromOs, pillarFromCatalog } from "@/lib/content/platform-pillars";
import { getOsPage } from "@/lib/content/platform-os";
import { metadataFromRegistry } from "@/lib/route-registry";

const PATH = "/platform/commerce";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "Commerce | RINADS" };
}

export default function CommercePillarPage() {
  const product = pillarFromCatalog("commerce");
  const os = getOsPage("commerce-os");
  if (!product || !os) return null;

  return (
    <PlatformPillarPage
      path={PATH}
      eyebrow="Commerce"
      title={product.name}
      headline={os.headline}
      summary={os.summary}
      status={product.status}
      bullets={pillarBulletsFromOs("commerce-os")}
      related={[
        { label: "Business", href: "/platform/business" },
        { label: "Growth", href: "/platform/growth" },
        { label: "Retail edition", href: "/solutions/retail" },
      ]}
    />
  );
}
