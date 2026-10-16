import type { Metadata } from "next";
import { MarketingPageShell, PageHero, Breadcrumbs, BusinessAssessment } from "@/components/system";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { metadataFromRegistry } from "@/lib/route-registry";
import { CTAS } from "@/lib/ctas";

const PATH = "/business-readiness";

export async function generateMetadata(): Promise<Metadata> {
  return (
    (metadataFromRegistry(PATH) as Metadata) ?? {
      title: "Business Readiness Assessment | RINADS",
      description:
        "RINADS Business Readiness Assessment — practical pathway guidance for growing businesses. Not a certification.",
    }
  );
}

export default function BusinessReadinessPage() {
  return (
    <>
      <CommercialJsonLd
        path={PATH}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
          { name: "Business Readiness", path: PATH },
        ]}
      />
      <MarketingPageShell>
        <div className="px-6 pt-28 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <Breadcrumbs
              items={[
                { name: "Home", path: "/" },
                { name: "Resources", path: "/resources" },
                { name: "Business Readiness", path: PATH },
              ]}
            />
          </div>
        </div>
        <PageHero
          eyebrow="Resources"
          headline="RINADS Business Readiness Assessment"
          summary="A simple orientation across business type, tools, automation maturity and growth priority. Not a certification — a practical pathway guide."
          primaryHref={CTAS.bookDemo.href}
          primaryLabel={CTAS.bookDemo.label}
          secondaryHref={CTAS.viewPricing.href}
          secondaryLabel={CTAS.viewPricing.label}
        />
        <section className="px-6 pb-24 md:px-12 lg:px-20">
          <div className="mx-auto max-w-2xl">
            <BusinessAssessment />
          </div>
        </section>
      </MarketingPageShell>
    </>
  );
}
