"use client";

import { MarketingPageShell, PageHero } from "@/components/system";
import { LeadForm } from "@/components/system/LeadForm";

export function ProjectsClient() {
  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Projects"
        headline="Start a project conversation."
        summary="Tell us what you want to achieve — run the business better, replace disconnected tools, launch commerce, automate work, or build software on the RINADS layer."
        primaryHref="/contact?intent=demo"
        primaryLabel="Book a platform demo"
        secondaryHref="/pricing"
        secondaryLabel="View pricing"
      />
      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl">
          <LeadForm
            defaultIntent="project"
            sourcePath="/projects"
            heading="What are you trying to achieve?"
          />
        </div>
      </section>
    </MarketingPageShell>
  );
}
