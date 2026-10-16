import type { Metadata } from "next";
import { MarketingPageShell, PageHero, Breadcrumbs, BusinessAssessment } from "@/components/system";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (
    (metadataFromRegistry("/resources/business-readiness") as Metadata) ?? {
      title: "Business Readiness Assessment | RINADS",
      description:
        "RINADS Business Readiness Assessment — a practical orientation to recommended pathways. Not a certification.",
    }
  );
}

export default function BusinessReadinessPage() {
  return (
    <>
      <CommercialJsonLd
        path="/resources/business-readiness"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
          { name: "Business Readiness", path: "/resources/business-readiness" },
        ]}
      />
      <MarketingPageShell>
        <div className="px-6 pt-28 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <Breadcrumbs
              items={[
                { name: "Home", path: "/" },
                { name: "Resources", path: "/resources" },
                { name: "Business Readiness", path: "/resources/business-readiness" },
              ]}
            />
          </div>
        </div>
        <PageHero
          eyebrow="Resources"
          headline="RINADS Business Readiness Assessment"
          summary="A simple orientation across business type, tools, automation maturity and growth priority. Not a certification — a practical pathway guide."
          primaryHref="/contact?intent=demo"
          primaryLabel="Book a demo"
          secondaryHref="/pricing"
          secondaryLabel="View pricing"
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
