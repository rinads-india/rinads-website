import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import {
  SECURITY_CONTROLS,
  type SecurityControlStatus,
} from "@/lib/content/case-studies";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/security") as Metadata) ?? { title: "Security | RINADS" };
}

const STATUS_LABEL: Record<SecurityControlStatus, string> = {
  implemented: "Implemented",
  partial: "Partial",
  in_progress: "In progress",
  planned: "Planned",
  not_currently_claimed: "Not currently claimed",
};

const STATUS_CLASS: Record<SecurityControlStatus, string> = {
  implemented: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
  partial: "border-sky-500/35 bg-sky-500/10 text-sky-300",
  in_progress: "border-amber-500/35 bg-amber-500/10 text-amber-200",
  planned: "border-white/20 bg-white/5 text-white/70",
  not_currently_claimed: "border-white/15 bg-transparent text-white/45",
};

export default function SecurityPage() {
  return (
    <>
      <CommercialJsonLd
        path="/security"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Security", path: "/security" },
        ]}
      />
      <MarketingPageShell>
        <PageHero
          eyebrow="Security"
          headline="AI that operates inside business controls."
          summary="RINADS is designed so assistance, recommendations, and supported actions stay inside organisation context, permissions, and human approval where required."
          primaryHref="/contact?intent=security"
          primaryLabel="Security enquiry"
          secondaryHref="/legal/dpa"
          secondaryLabel="Data processing"
        />

        <section className="px-6 pb-10 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-sm text-amber-200">
            Compliance certifications are not claimed on this page. No SOC 2, ISO 27001, GDPR, DPDP, HIPAA, or
            uptime SLA is asserted unless separately verified and counsel-approved.
          </div>
        </section>

        <section className="px-6 pb-24 md:px-12 lg:px-20">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2">
            {SECURITY_CONTROLS.map((control) => (
              <article key={control.id} className="border border-white/10 p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-lg font-bold text-foreground">{control.title}</h2>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${STATUS_CLASS[control.status]}`}
                  >
                    {STATUS_LABEL[control.status]}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{control.summary}</p>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-10 max-w-7xl text-sm text-muted-foreground">
            Questions about security posture or subprocessors?{" "}
            <Link href="/contact?intent=security" className="font-semibold text-rinads-primary hover:underline">
              Contact the team
            </Link>{" "}
            or review{" "}
            <Link href="/legal/subprocessors" className="font-semibold text-rinads-primary hover:underline">
              subprocessors
            </Link>
            .
          </p>
        </section>
      </MarketingPageShell>
    </>
  );
}
