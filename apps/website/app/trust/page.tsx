import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { metadataFromRegistry } from "@/lib/route-registry";
import { FOOTER_TRUST } from "@/lib/product-ia";
import { CTAS } from "@/lib/ctas";

const PATH = "/trust";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "Trust | RINADS" };
}

export default function TrustHubPage() {
  return (
    <>
      <CommercialJsonLd
        path={PATH}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Trust", path: PATH },
        ]}
      />
      <MarketingPageShell>
        <PageHero
          eyebrow="Trust"
          headline="Honest trust material for operators and buyers."
          summary="Security posture, availability labels, privacy, and service status — without invented certifications, uptime theatre, or customer counts."
          primaryHref={CTAS.viewSecurity.href}
          primaryLabel={CTAS.viewSecurity.label}
          secondaryHref={CTAS.viewAvailability.href}
          secondaryLabel={CTAS.viewAvailability.label}
        />
        <section className="px-6 pb-24 md:px-12 lg:px-20">
          <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2">
            {FOOTER_TRUST.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:border-rinads-primary/40"
              >
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{item.label}</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  {item.label === "Security"
                    ? "How AI operates inside identity, permissions, approvals, and audit controls."
                    : item.label === "Availability"
                      ? "What Available, Pilot, Preview, and Roadmap mean on this site."
                      : item.label === "Privacy"
                        ? "How we handle information — with the full policy on the company legal page."
                        : "Service status claims only when backed by monitoring."}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </MarketingPageShell>
    </>
  );
}
