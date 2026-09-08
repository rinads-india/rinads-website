"use client";

import {
  MarketingPageShell,
  PageHero,
  RINPOOrb,
  RINPOChat,
  CommandBar,
  CTASection,
} from "@/components/system";
import { RINPO_ROLES, RINPO_CHANNELS } from "@/lib/content/services";
import Link from "next/link";

export function RinpoClient() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="RINPO"
        headline="The persistent AI interface for business."
        summary="RINPO is the AI Business Intelligence Character — assistant, tutor, operator, voice agent, phone agent, and commerce assistant across every channel."
        primaryHref="/signup"
        primaryLabel="Start with RINADS"
        secondaryHref="/platform/rinads-intelligence"
        secondaryLabel="RINADS Intelligence"
      />

      <section className="px-6 pb-16 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div>
            <RINPOOrb size="xl" priority />
            <div className="mt-8">
              <CommandBar commands={["What's happening today?", "Train my team", "Track my orders"]} />
            </div>
          </div>
          <RINPOChat className="min-h-[360px]" />
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Roles</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {RINPO_ROLES.map((role) => (
              <div key={role.name} className="border border-white/10 p-4">
                <p className="text-sm font-semibold text-foreground">{role.name}</p>
                <p className="mt-2 text-xs text-muted-foreground">{role.description}</p>
              </div>
            ))}
          </div>
          <h2 className="mt-14 text-2xl font-bold text-foreground">Channels</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {RINPO_CHANNELS.map((ch) => (
              <span key={ch} className="rounded-full border border-rinads-primary/30 px-4 py-2 text-sm text-white/80">
                {ch}
              </span>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-4 text-sm font-semibold text-rinads-primary">
            <Link href="/rinpo/intelligence">Intelligence →</Link>
            <Link href="/rinpo/story">Story →</Link>
            <Link href="/rinpo/voice">Voice →</Link>
            <Link href="/rinpo/phone">Phone →</Link>
          </div>
        </div>
      </section>

      <CTASection
        headline="Talk to RINPO."
        summary="RINPO is the interface. RINADS Intelligence is the brain. RINADS is the operating platform."
      />
    </MarketingPageShell>
  );
}
