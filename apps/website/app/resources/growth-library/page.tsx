import type { Metadata } from "next";
import { MarketingPageShell, PageHero } from "@/components/system";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { metadataFromRegistry } from "@/lib/route-registry";
import { GrowthLibraryClient } from "./GrowthLibraryClient";

const PATH = "/resources/growth-library";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "RI GROWTH Knowledge Library | RINADS" };
}

export default function GrowthLibraryPage() {
  return (
    <>
      <CommercialJsonLd path={PATH} breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Resources", path: "/resources" },
        { name: "RI GROWTH Knowledge", path: PATH },
      ]} />
      <MarketingPageShell>
        <PageHero
          eyebrow="RI LABS · RI GROWTH"
          headline="A little knowledge. A measurable advantage."
          summary="Original guides on technical SEO, local discovery, Search Console, AI search readiness and converting visibility into business outcomes. No paid-rank promises or invented client results."
          primaryHref="/grow/search-intelligence"
          primaryLabel="Explore Search Intelligence"
          secondaryHref="/resources"
          secondaryLabel="All resources"
        />
        <GrowthLibraryClient />
      </MarketingPageShell>
    </>
  );
}
