import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketingPageShell, PageHero } from "@/components/system";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { metadataFromRegistry } from "@/lib/route-registry";
import { ContactClient } from "./ContactClient";

type ContactPageProps = {
  searchParams: Promise<{ intent?: string; plan?: string; source?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/contact") as Metadata) ?? { title: "Contact | RINADS" };
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const intent = params.intent;
  const plan = params.plan;

  const headline =
    intent === "demo"
      ? "Book a demo with the RINADS team."
      : intent === "audit"
        ? "Request your free Business Simplified Audit."
        : intent === "sales"
          ? "Talk to sales about the right plan for your organisation."
          : intent === "implementation"
            ? "Talk through implementation with a specialist."
            : intent === "partner"
              ? "Explore a partnership with RINADS."
              : "Book a demo or talk to the RINADS team.";

  const summary =
    plan != null
      ? `You selected the ${plan} plan interest. Tell us about your organisation and we will follow up.`
      : intent === "audit"
        ? "Share the basics about your business. RINADS will use the information you provide to prepare a practical review of your current setup, digital presence and operating gaps."
        : intent === "partner"
          ? "Share the partnership you have in mind — implementation, referrals, integrations, education, or another strategic collaboration."
          : "Share what you want to achieve — running the business, replacing tools, launching commerce, or implementing AI with control.";

  return (
    <>
      <CommercialJsonLd
        path="/contact"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ]}
      />
      <MarketingPageShell>
        <PageHero eyebrow={intent === "audit" ? "Free audit" : "Contact"} headline={headline} summary={summary} />
        <section className="px-6 pb-24 md:px-12 lg:px-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <h2 className="text-xl font-bold text-foreground md:text-2xl">
                {intent === "audit" ? "What the audit request covers" : "How conversations typically go"}
              </h2>
              {intent === "audit" ? (
                <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                  <li>Current website, social and customer-conversion setup where you provide access or public links.</li>
                  <li>How leads, bookings, sales, stock, staff or follow-up are handled today.</li>
                  <li>The clearest operating gaps RINADS can identify from the information available.</li>
                  <li>No promised outcomes or invented scores — recommendations are based on observable information.</li>
                </ul>
              ) : (
                <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                  <li>We clarify your current tools, workflows, and priorities.</li>
                  <li>We map which operating systems and integrations matter first.</li>
                  <li>We outline software subscription vs implementation services when both apply.</li>
                  <li>No invented SLAs, certifications, or pricing — only what we can stand behind.</li>
                </ul>
              )}
              <p className="mt-8 text-sm text-muted-foreground">
                Prefer a project brief first?{" "}
                <a href="/projects" className="font-semibold text-rinads-primary hover:underline">
                  Start a project conversation
                </a>
                .
              </p>
            </div>
            <Suspense
              fallback={
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-muted-foreground">
                  Loading form…
                </div>
              }
            >
              <ContactClient />
            </Suspense>
          </div>
        </section>
      </MarketingPageShell>
    </>
  );
}
