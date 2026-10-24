import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketingPageShell, PageHero } from "@/components/system";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { ContactClient } from "@/app/contact/ContactClient";
import { metadataFromRegistry } from "@/lib/route-registry";

const PATH = "/company/contact";

type ContactPageProps = {
  searchParams: Promise<{ intent?: string; plan?: string; flow?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "Contact | RINADS" };
}

export default async function CompanyContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const intent = params.intent;

  const headline =
    intent === "demo"
      ? "Book a demo with the RINADS team."
      : intent === "sales"
        ? "Connect your business — find the right plan for your organisation."
        : intent === "implementation"
          ? "Connect your business with an implementation conversation."
          : intent === "security"
            ? "Security or reliability enquiry."
            : "Book a demo or talk to the RINADS team.";

  const summary =
    params.plan != null
      ? `You selected the ${params.plan} plan interest. Tell us about your organisation and we will follow up.`
      : "Share what you want to achieve — running the business, replacing tools, launching commerce, or implementing AI with control.";

  return (
    <>
      <CommercialJsonLd
        path={PATH}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Company", path: "/company" },
          { name: "Contact", path: PATH },
        ]}
      />
      <MarketingPageShell>
        <PageHero eyebrow="Contact" headline={headline} summary={summary} />
        <section className="px-6 pb-24 md:px-12 lg:px-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <h2 className="text-xl font-bold text-foreground md:text-2xl">How conversations typically go</h2>
              <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                <li>We learn your operating context and which outcomes matter first.</li>
                <li>We map those outcomes to platform pillars, editions, or implementation services.</li>
                <li>We agree on pilot scope, availability labels, and realistic next steps.</li>
              </ul>
            </div>
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading form…</div>}>
              <ContactClient />
            </Suspense>
          </div>
        </section>
      </MarketingPageShell>
    </>
  );
}
