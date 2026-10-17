"use client";

import {
  CTASection,
  MarketingPageShell,
  PageHero,
} from "@/components/system";
import { RinpoLive } from "@/components/rinpo/RinpoLive";

export function LiveClient() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="RINPO Live"
        headline="Talk to RINPO, face to face."
        summary="A real-time video conversation with the RINPO character, in your language. RINPO answers from RINADS's own product and service information and tells you plainly what is available today and what is still planned."
        primaryHref="/rinpo"
        primaryLabel="RINPO overview"
        secondaryHref="/rinpo/voice"
        secondaryLabel="Browser voice demo"
      />

      <section className="px-6 pb-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-4xl">
          <RinpoLive />
          <p className="mt-6 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
            RINPO Live is a conversation, not an operator. It can explain, recommend a next step and
            show you a page. It does not act inside business systems, and it never quotes prices —
            pricing is configured with the team.
          </p>
        </div>
      </section>

      <CTASection
        headline="Prefer a person? Talk to the team."
        summary="Book a demo or a free consultation and we will walk through workflows that match your business."
      />
    </MarketingPageShell>
  );
}
