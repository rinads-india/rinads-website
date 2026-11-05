import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { metadataFromRegistry } from "@/lib/route-registry";

const PATH = "/grow/search-intelligence";

const stages = [
  {
    title: "Discover",
    description: "Review public pages, crawl access, canonical URLs, indexable content and owned Search Console properties.",
  },
  {
    title: "Prioritize",
    description: "Identify useful content and local-intent opportunities without manufacturing ranking scores or AI citations.",
  },
  {
    title: "Approve",
    description: "Give the business owner a clear plan with estimated effort, risks and an explicit approval before publishing changes.",
  },
  {
    title: "Measure",
    description: "Compare genuine search queries, qualified enquiries, bookings and attributable outcomes over time.",
  },
] as const;

const signals = [
  "Organic search clicks, impressions and query trends where Google Search Console access is authorized",
  "Crawlability, canonical URLs, page titles, descriptions and the sitemap",
  "Verified local business information and customer conversion journeys",
  "Qualified enquiries, bookings and sales linked to the business's own records",
] as const;

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? {
    title: "Search Visibility & AI Search Readiness | RINADS",
  };
}

export default function SearchIntelligencePilotPage() {
  return (
    <>
      <CommercialJsonLd
        path={PATH}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Growth", path: "/platform/growth" },
          { name: "Search Intelligence", path: PATH },
        ]}
      />
      <MarketingPageShell>
        <PageHero
          eyebrow="RI GROWTH · Search Intelligence Pilot"
          headline="Get found by the right customers. Connect visibility to business results."
          summary="A practical, human-reviewed search visibility service for growing businesses. Start with technical SEO, helpful content and local discovery. RINPO-powered reporting and provider connections remain subject to pilot verification."
          primaryHref="/contact?intent=audit&source=ri-growth-search-intelligence"
          primaryLabel="Request a visibility audit"
          secondaryHref="/resources/growth-library"
          secondaryLabel="Read growth guides"
        />
        <section className="px-6 pb-16 md:px-12 lg:px-20" aria-labelledby="pilot-status">
          <div className="mx-auto max-w-7xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">Availability: Pilot planning</p>
            <h2 id="pilot-status" className="mt-3 text-xl font-bold text-foreground">Start with an evidence-based audit—not an automated ranking promise.</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
              Public page checks can be completed without account access. Personalised Google Search Console, Google Business Profile or analytics reporting requires the business owner&apos;s authorization. Google AI-search citations, Discover distribution and rankings are never guaranteed.
            </p>
          </div>
        </section>
        <section className="px-6 pb-20 md:px-12 lg:px-20" aria-labelledby="how-it-works">
          <div className="mx-auto max-w-7xl">
            <h2 id="how-it-works" className="text-3xl font-bold text-foreground">How the pilot works</h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">Four steps designed for repeatability and owner control.</p>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stages.map((stage, index) => (
                <article key={stage.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                  <p className="text-sm font-semibold text-rinads-primary">0{index + 1}</p>
                  <h3 className="mt-3 text-xl font-bold text-foreground">{stage.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{stage.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="px-6 pb-24 md:px-12 lg:px-20" aria-labelledby="what-we-measure">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 id="what-we-measure" className="text-3xl font-bold text-foreground">Evidence that matters to the business</h2>
              <p className="mt-4 text-muted-foreground">We focus on observable visibility and business conversion—not proprietary or fabricated search-engine scores.</p>
              <ul className="mt-6 list-disc space-y-3 pl-5 text-sm leading-7 text-muted-foreground">
                {signals.map((signal) => <li key={signal}>{signal}</li>)}
              </ul>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7">
              <h3 className="text-xl font-bold text-foreground">Built on RINADS, governed by the owner</h3>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                RI GROWTH belongs to the same RINADS platform. RINADS INTELLIGENCE can analyze approved reports, while RINPO RUNTIME will only execute supported actions under role permissions, policy checks and audit records after implementation and validation.
              </p>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Planned automations are not represented here as active integrations. Local business listing edits, site publishing and customer outreach require explicit authorization and verified access.
              </p>
              <Link href="/contact?intent=audit&source=ri-growth-search-intelligence" className="mt-6 inline-flex rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark">
                Request a pilot conversation
              </Link>
            </div>
          </div>
        </section>
      </MarketingPageShell>
    </>
  );
}
