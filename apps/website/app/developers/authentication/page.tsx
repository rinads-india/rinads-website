import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (
    (metadataFromRegistry("/developers/authentication") as Metadata) ?? {
      title: "Authentication | RINADS Developers",
    }
  );
}

export default function DevelopersAuthenticationPage() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Developers · Authentication"
        headline="Authenticate inside organisation context."
        summary="RINADS product access is organised around authenticated sessions and organisation membership. Public developer credential formats are documented only when they are stable."
      />
      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl space-y-6 text-muted-foreground">
          <p>
            Foundation principle: every meaningful action should be attributable to an authenticated
            principal acting within an organisation boundary.
          </p>
          <p>
            Detailed OAuth, API key, or service-account flows will appear here when the corresponding
            interfaces are contractually stable. We do not publish placeholder credentials or fake token
            examples as if they were production contracts.
          </p>
          <p className="text-sm">
            <Link href="/developers" className="font-semibold text-rinads-primary hover:underline">
              ← Developers hub
            </Link>
          </p>
        </div>
      </section>
    </MarketingPageShell>
  );
}
