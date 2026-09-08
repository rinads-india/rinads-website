"use client";

import Link from "next/link";
import {
  MarketingPageShell,
  PageHero,
  CTASection,
  WorkflowDiagram,
} from "@/components/system";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { POSITIONING } from "@/lib/product-ia";

export function CompanyClient() {
  const { openPhoneScreen } = useRinpo();

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Company"
        headline={POSITIONING.hero}
        summary="RINADS is not another business application. RINADS is the intelligent operating platform through which a business can run, build, grow, learn, and automate."
        primaryHref="/projects"
        primaryLabel="Start a project"
        secondaryHref="/signup"
        secondaryLabel="Start with RINADS"
      />

      <section id="about" className="px-6 pb-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">About RINADS</h2>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            RINPO is the interface. RINADS Intelligence is the brain. RINADS is the operating platform —
            powered by a common core with vertical configuration for industries that need depth.
          </p>
          <div className="mt-10">
            <WorkflowDiagram compact />
          </div>
          <div className="mt-10 flex flex-wrap gap-4 text-sm font-semibold text-rinads-primary">
            <Link href="/platform">Platform →</Link>
            <Link href="/rinpo">RINPO →</Link>
            <Link href="/academy">Academy →</Link>
            <Link href="/services">Services →</Link>
            <Link href="/projects">Projects →</Link>
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-white/10 px-6 py-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold text-foreground">Contact</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Talk to RINPO, start a project, or create your RINADS account.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openPhoneScreen("chat", "I want to talk about RINADS")}
              className="rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white hover:bg-rinads-primary-dark"
            >
              Talk to RINPO
            </button>
            <Link
              href="/projects"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-foreground hover:border-rinads-primary/50"
            >
              Start a project
            </Link>
          </div>
        </div>
      </section>

      <CTASection headline="Join the operating platform." />
    </MarketingPageShell>
  );
}
