import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { metadataFromRegistry } from "@/lib/route-registry";

export async function generateMetadata(): Promise<Metadata> {
  return (metadataFromRegistry("/docs") as Metadata) ?? { title: "Documentation | RINADS" };
}

const HUBS = [
  {
    href: "/developers",
    label: "Developers",
    description: "Authentication, organisation model, APIs, webhooks, and events — only stable interfaces.",
  },
  {
    href: "/security",
    label: "Security",
    description: "How AI operates inside identity, permissions, approvals, and audit controls.",
  },
  {
    href: "/platform",
    label: "Platform",
    description: "Operating systems, Intelligence, and Cloud foundation overview for buyers and operators.",
  },
  {
    href: "/resources",
    label: "Resources",
    description: "Guides and paths into the platform as published materials become available.",
  },
] as const;

export default function DocsPage() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Docs"
        headline="Documentation for the RINADS foundation."
        summary="This hub links to what is documented today. We do not invent API catalogues, incomplete guides, or undocumented endpoints."
      />

      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 border border-white/10 p-5 text-sm text-muted-foreground">
            Honest scope: only foundation topics are published here. Detailed reference material expands as
            interfaces become contractually stable.
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {HUBS.map((hub) => (
              <Link
                key={hub.href}
                href={hub.href}
                className="border border-white/10 p-6 transition hover:border-rinads-primary/40"
              >
                <h2 className="text-xl font-bold text-foreground">{hub.label}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{hub.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MarketingPageShell>
  );
}
