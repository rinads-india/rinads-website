import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketingPageShell, PageHero, CTASection, Breadcrumbs } from "@/components/system";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { COMPANY_CONFIG } from "@/lib/content/companyConfig";
import { metadataFromRegistry } from "@/lib/route-registry";
import { CTAS } from "@/lib/ctas";

const PATH = "/company/founder";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "Founder | RINADS" };
}

export default function CompanyFounderPage() {
  const { founder, location, legalName } = COMPANY_CONFIG;

  return (
    <>
      <CommercialJsonLd
        path={PATH}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Company", path: "/company" },
          { name: "Founder", path: PATH },
        ]}
      />
      <MarketingPageShell>
        <div className="px-6 pt-28 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <Breadcrumbs
              items={[
                { name: "Home", path: "/" },
                { name: "Company", path: "/company" },
                { name: "Founder", path: PATH },
              ]}
            />
          </div>
        </div>
        <PageHero
          eyebrow="Company"
          headline="Founder"
          summary="Verified founder information only — no invented funding, headcount, or certification claims."
          primaryHref={CTAS.bookDemo.href}
          primaryLabel={CTAS.bookDemo.label}
          secondaryHref="/company"
          secondaryLabel="Company overview"
          compactTop
        />
        <section className="px-6 pb-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {founder.headshotSrc ? (
                <Image
                  src={founder.headshotSrc}
                  alt={`${founder.name}, ${founder.title}`}
                  width={160}
                  height={160}
                  className="h-40 w-40 rounded-2xl object-cover"
                />
              ) : null}
              <div>
                <p className="text-xl font-bold text-foreground">{founder.name}</p>
                <p className="mt-1 text-sm font-semibold text-rinads-primary">{founder.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{legalName}</p>
                <p className="mt-4 text-muted-foreground">{founder.story}</p>
                <p className="mt-4 text-sm text-muted-foreground">{location.display}</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold text-rinads-primary">
              <Link href="/company/story">Company story →</Link>
              <Link href="/company/rinpo-story">RINPO narrative →</Link>
              <Link href="/company/contact">Contact →</Link>
            </div>
          </div>
        </section>
        <CTASection headline="Talk with the team building the RINADS Business Intelligence Platform." />
      </MarketingPageShell>
    </>
  );
}
