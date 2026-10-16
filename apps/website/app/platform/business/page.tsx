import type { Metadata } from "next";
import { PlatformPillarPage } from "@/components/system/PlatformPillarPage";
import { pillarBulletsFromOs, pillarFromCatalog } from "@/lib/content/platform-pillars";
import { getOsPage } from "@/lib/content/platform-os";
import { CTAS } from "@/lib/ctas";
import { metadataFromRegistry } from "@/lib/route-registry";

const PATH = "/platform/business";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "Business | RINADS" };
}

export default function BusinessPillarPage() {
  const product = pillarFromCatalog("business");
  const os = getOsPage("business-os");
  if (!product || !os) return null;

  return (
    <PlatformPillarPage
      path={PATH}
      eyebrow="Business"
      title={product.name}
      headline={os.headline}
      summary={os.summary}
      status={product.status}
      bullets={pillarBulletsFromOs("business-os")}
      primaryCta={CTAS.bookDemo}
      secondaryCta={CTAS.seeRinpo}
      related={[
        { label: "Commerce", href: "/platform/commerce" },
        { label: "Automation", href: "/platform/automation" },
        { label: "Business workspace", href: "/os" },
      ]}
    />
  );
}
