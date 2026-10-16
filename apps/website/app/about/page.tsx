import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketingPageShell, PageHero, CTASection, Breadcrumbs } from "@/components/system";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { metadataFromRegistry } from "@/lib/route-registry";
import { COMPANY_CONFIG } from "@/lib/content/companyConfig";
import { buildLocalBusinessJsonLd } from "@/lib/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/about") as Metadata) ?? { title: "About RINADS" };
}

export default function AboutPage() {
  const { founder, location, legalName, siteUrl } = COMPANY_CONFIG;

  return (
    <>
      <CommercialJsonLd
        path="/about"
        includeOrganization
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ]}
        extra={buildLocalBusinessJsonLd({
          name: legalName,
          url: siteUrl,
          city: location.city,
          region: location.region,
          country: location.country,
        })}
      />
      <MarketingPageShell>
        <div className="px-6 pt-28 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <Breadcrumbs
              items={[
                { name: "Home", path: "/" },
                { name: "Company", path: "/about" },
                { name: "About", path: "/about" },
              ]}
            />
          </div>
        </div>

        <PageHero
          eyebrow="About"
          headline="Building the operating layer for modern businesses."
          summary="Most teams run on fragmented CRM, commerce, project, marketing, and automation tools. RINADS connects those workflows on one foundation — with RINPO as the governed AI interface."
          primaryHref="/contact?intent=demo"
          primaryLabel="Book a demo"
          secondaryHref="/platform"
          secondaryLabel="Explore the platform"
        />

        <section className="px-6 pb-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">The thesis</h2>
            <p className="mt-4 text-muted-foreground">
              Growing businesses do not need another disconnected app. They need an operating layer where
              customers, work, money, growth, and automation share context — so people and AI assistants can
              act inside the same controls.
            </p>
            <p className="mt-4 text-muted-foreground">
              RINADS is that layer: connected operating systems on a shared cloud foundation, with
              implementation services when configuration or migration is required.
            </p>
          </div>
        </section>

        <section className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">Founder</h2>
            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
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
            <p className="mt-8 text-muted-foreground">
              We do not invent headcount, funding rounds, customer counts, or compliance certifications for
              marketing effect. Availability labels and security claims stay tied to what is implemented.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold text-rinads-primary">
              <Link href="/company">Company →</Link>
              <Link href="/careers">Careers →</Link>
              <Link href="/contact">Contact →</Link>
              <Link href="/company/rinpo-story">RINPO narrative →</Link>
            </div>
          </div>
        </section>

        <CTASection
          headline="Talk with the team building the operating layer."
          summary="Book a demo or start a project conversation — we will meet you where your operations are today."
          primaryLabel="Book a demo"
        />
      </MarketingPageShell>
    </>
  );
}
