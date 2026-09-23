"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Boxes,
  CheckCircle2,
  Layers3,
  Sparkles,
  Workflow,
} from "lucide-react";
import {
  MarketingPageShell,
  PageHero,
  ServiceCard,
  CTASection,
} from "@/components/system";
import { SERVICE_LINES } from "@/lib/content/services";
import { getServiceExperience } from "@/lib/service-experience";
import type { ServiceCatalogItem } from "@/lib/services/types";
import { formatServicePrice } from "@/lib/services/types";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

type Props = {
  catalog: ServiceCatalogItem[];
};

const DELIVERY_MODEL = [
  {
    title: "Platform first",
    description: "Use RINADS Operating Systems, Intelligence, RINPO, and Cloud as the delivery foundation wherever they fit.",
    icon: Layers3,
  },
  {
    title: "Service expertise",
    description: "Bring strategy, implementation, creative, growth, automation, transformation, or training around that platform.",
    icon: Boxes,
  },
  {
    title: "Operational handover",
    description: "Move from project work into a usable system, workflow, team capability, or measurable operating outcome.",
    icon: Workflow,
  },
] as const;

export function ServicesClient({ catalog }: Props) {
  const { openPhoneScreen } = useRinpo();

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="RINADS Services"
        headline="Implementation capability around the RINADS platform."
        summary="Build software, grow brands, apply intelligence, automate operations, create media, transform systems, and train people — with delivery anchored to the same platform architecture."
        primaryHref="/projects"
        primaryLabel="Start a project"
        secondaryHref="/platform"
        secondaryLabel="Explore the platform"
      />

      <section className="px-6 pb-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-3 lg:grid-cols-3">
            {DELIVERY_MODEL.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon size={18} className="text-[var(--text-muted)]" aria-hidden />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-[var(--text-primary)]">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
                Seven service lines
              </p>
              <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                Choose the outcome. Keep the platform connected.
              </h2>
              <p className="mt-4 max-w-2xl text-[var(--text-muted)]">
                Each service line has a different delivery discipline, but all can connect back to RINADS rather than becoming standalone agency work.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                openPhoneScreen(
                  "chat",
                  "Help me choose the right RINADS service for what I want to build, grow, automate, create, transform, or train."
                )
              }
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
            >
              Ask RINPO
              <ArrowRight size={15} aria-hidden />
            </button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_LINES.map((service) => {
              const experience = getServiceExperience(service.slug);
              return (
                <ServiceCard
                  key={service.slug}
                  name={experience?.publicName ?? service.name}
                  verb={experience?.publicVerb ?? service.verb}
                  summary={experience?.outcome ?? service.summary}
                  href={`/services/${service.slug}`}
                />
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <Bot size={24} className="text-rinads-primary" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                RINPO project intake
              </p>
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
              Start from the business problem, not the service label.
            </h2>
            <p className="mt-5 max-w-xl text-[var(--text-muted)]">
              RINPO can help structure the problem, identify the likely delivery path, and route the conversation toward platform implementation or a specialist service.
            </p>
            <Link
              href="/projects"
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline"
            >
              Start project intake
              <ArrowRight size={15} aria-hidden />
            </Link>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-black p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
              Delivery path
            </p>
            <div className="mt-5 space-y-3">
              {[
                ["Problem", "What outcome or operating issue needs to change?"],
                ["Platform fit", "Which RINADS systems or shared primitives already fit?"],
                ["Service scope", "What implementation, creative, growth, AI, or enablement work is required?"],
                ["Execution", "Deliver, validate, hand over, and measure."],
              ].map(([title, detail], index) => (
                <div key={title} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-semibold text-rinads-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-white/50">{detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {catalog.length > 0 ? (
        <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={22} className="mt-1 text-rinads-primary" aria-hidden />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                  Orderable service catalog
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-4xl">
                  Current catalog items from the platform.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                  These entries are loaded from the active RINADS service catalog. Pricing shown here comes from the platform data rather than static marketing copy.
                </p>
              </div>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {catalog.map((item) => (
                <Link
                  key={item.id}
                  href={`/services/${item.slug}`}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-rinads-primary/40"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">{item.pillar}</p>
                  <h3 className="mt-3 font-bold text-[var(--text-primary)]">{item.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{item.description}</p>
                  <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">{formatServicePrice(item)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl rounded-3xl border border-rinads-primary/25 bg-rinads-primary/[0.05] p-6 md:p-8">
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-rinads-primary" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
              Platform + Services
            </p>
          </div>
          <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-4xl">
            The service should leave behind a stronger operating system.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
            The goal is not simply delivery activity. The goal is a better product, workflow, growth system, creative pipeline, operating model, or team capability that can continue after the engagement.
          </p>
        </div>
      </section>

      <CTASection
        headline="Build the outcome with RINADS."
        summary="Start with the problem. RINPO can help structure the project and connect it to the right platform and service path."
      />
    </MarketingPageShell>
  );
}
