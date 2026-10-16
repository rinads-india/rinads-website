import type { Metadata } from "next";
import { PlatformPillarPage } from "@/components/system/PlatformPillarPage";
import { pillarBulletsFromOs, pillarFromCatalog } from "@/lib/content/platform-pillars";
import { getOsPage } from "@/lib/content/platform-os";
import { metadataFromRegistry } from "@/lib/route-registry";

const PATH = "/platform/growth";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "Growth | RINADS" };
}

export default function GrowthPillarPage() {
  const product = pillarFromCatalog("growth");
  const marketing = getOsPage("marketing-os");
  const creative = getOsPage("creative-os");
  if (!product || !marketing) return null;

  const bullets = [
    ...pillarBulletsFromOs("marketing-os"),
    ...(creative?.modules.slice(0, 4).map((m) => `Creative — ${m.name}`) ?? []),
  ];

  return (
    <PlatformPillarPage
      path={PATH}
      eyebrow="Growth"
      title={product.name}
      headline={marketing.headline}
      summary={product.description}
      status={product.status}
      bullets={bullets}
      related={[
        { label: "Business", href: "/platform/business" },
        { label: "Commerce", href: "/platform/commerce" },
        { label: "Growth services", href: "/services#growth-systems" },
      ]}
    />
  );
}
