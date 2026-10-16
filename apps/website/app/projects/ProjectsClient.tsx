"use client";

import { useEffect } from "react";
import { MarketingPageShell, PageHero } from "@/components/system";
import { LeadForm } from "@/components/system/LeadForm";
import { CTAS } from "@/lib/ctas";
import { trackMarketing } from "@/lib/analytics";

export function ProjectsClient() {
  useEffect(() => {
    trackMarketing("service_project_started", { source: "/projects" });
  }, []);

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Projects"
        headline="Start a project conversation."
        summary="Tell us what you want to achieve — run the business better, replace disconnected tools, launch commerce, automate work, or build software on the RINADS layer."
        primaryHref={CTAS.bookDemo.href}
        primaryLabel={CTAS.bookDemo.label}
        secondaryHref={CTAS.viewPricing.href}
        secondaryLabel={CTAS.viewPricing.label}
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
