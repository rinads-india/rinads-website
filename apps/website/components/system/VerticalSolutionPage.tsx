"use client";

import {
  MarketingPageShell,
  PageHero,
  ModuleGrid,
  CTASection,
} from "@/components/system";
import type { VerticalContent } from "@/lib/content/types";
import Link from "next/link";

export function VerticalSolutionPage({ vertical }: { vertical: VerticalContent }) {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow={`${vertical.type} · Vertical OS`}
        headline={vertical.headline}
        summary={vertical.summary}
        primaryHref="/signup"
        primaryLabel="Start with RINADS"
        secondaryHref="/solutions"
        secondaryLabel="All solutions"
      />
      <section className="px-6 pb-4 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-muted-foreground">
            Status:{" "}
            <span className={vertical.status === "available" ? "text-emerald-400" : "text-white/50"}>
              {vertical.status === "available" ? "Available" : "Coming soon"}
            </span>
          </p>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Business OS → Vertical OS. Common RINADS core with vertical configuration — not a separate technology platform.
          </p>
        </div>
      </section>
      <ModuleGrid title="Capabilities" modules={vertical.capabilities.map((c) => ({ name: c }))} />
      <section className="px-6 pb-8 md:px-12 lg:px-20">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-4">
          <Link href="/platform/business-os" className="text-sm font-semibold text-rinads-primary hover:underline">
            Business OS →
          </Link>
          <Link href="/platform" className="text-sm font-semibold text-rinads-primary hover:underline">
            Platform →
          </Link>
        </div>
      </section>
      <CTASection headline={`Configure ${vertical.name} on RINADS.`} />
    </MarketingPageShell>
  );
}
