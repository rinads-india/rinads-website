import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { metadataFromRegistry } from "@/lib/route-registry";

const PATH = "/trust/privacy";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry(PATH) as Metadata) ?? { title: "Privacy | RINADS" };
}

export default function TrustPrivacyPage() {
  return (
    <>
      <CommercialJsonLd
        path={PATH}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Trust", path: "/trust" },
          { name: "Privacy", path: PATH },
        ]}
      />
      <MarketingPageShell>
        <PageHero
          eyebrow="Privacy"
          headline="Privacy starts with clear legal terms."
          summary="This hub summarises how privacy is presented on RINADS.com. The counsel-reviewed policy lives on the company legal page."
        />
        <section className="px-6 pb-24 md:px-12 lg:px-20">
          <div className="mx-auto max-w-3xl space-y-6 text-sm text-muted-foreground">
            <p>
              RINADS collects information needed to operate the website, respond to enquiries, and deliver
              contracted platform services. We do not invent data practices for marketing effect.
            </p>
            <p>
              Read the full{" "}
              <Link href="/company/privacy" className="font-semibold text-rinads-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              for categories of data, purposes, retention, and contact details. Related legal pages include{" "}
              <Link href="/company/cookies" className="font-semibold text-rinads-primary hover:underline">
                cookies
              </Link>{" "}
              and the{" "}
              <Link href="/legal/dpa" className="font-semibold text-rinads-primary hover:underline">
                data processing addendum
              </Link>
              .
            </p>
          </div>
        </section>
      </MarketingPageShell>
    </>
  );
}
