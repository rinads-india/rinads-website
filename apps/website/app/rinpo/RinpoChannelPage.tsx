"use client";

import { MarketingPageShell, PageHero, CTASection, RINPOOrb } from "@/components/system";
import Link from "next/link";

type Props = {
  eyebrow: string;
  headline: string;
  summary: string;
  channel: string;
};

export function RinpoChannelPage({ eyebrow, headline, summary, channel }: Props) {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow={eyebrow}
        headline={headline}
        summary={summary}
        primaryHref="/signup"
        primaryLabel="Start with RINADS"
        secondaryHref="/rinpo"
        secondaryLabel="RINPO overview"
      />
      <section className="px-6 pb-16 md:px-12 lg:px-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 md:flex-row md:items-center">
          <RINPOOrb size="lg" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-rinads-primary">
              Channel · {channel}
            </p>
            <p className="mt-3 max-w-xl text-muted-foreground">
              RINPO remains the same character identity across Web, Mobile, Chat, Voice, WhatsApp, Phone, and 3D —
              selectively present, never noisy.
            </p>
            <Link href="/rinpo" className="mt-4 inline-block text-sm font-semibold text-rinads-primary hover:underline">
              All RINPO channels →
            </Link>
          </div>
        </div>
      </section>
      <CTASection headline={`Talk to RINPO on ${channel.toLowerCase()}.`} />
    </MarketingPageShell>
  );
}
