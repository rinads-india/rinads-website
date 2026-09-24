"use client";

import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2 } from "lucide-react";
import {
  MarketingPageShell,
  PageHero,
  ModuleGrid,
  CTASection,
  ProductStatus,
} from "@/components/system";
import { OperatingSystemDemo } from "@/components/system/OperatingSystemDemo";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { getOperatingSystemDemo } from "@/lib/os-demo-config";
import { getOsAvailability } from "@/lib/content/pricing";
import type { OsPageContent } from "@/lib/content/types";

export function OsMarketingPage({ content }: { content: OsPageContent }) {
  const { openPhoneScreen } = useRinpo();
  const demo = getOperatingSystemDemo(content.slug);
  const availability = getOsAvailability(content.slug);

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow={content.eyebrow}
        headline={content.headline}
        summary={content.summary}
        primaryHref="/contact?intent=demo"
        primaryLabel="Book a platform demo"
        secondaryHref="/platform"
        secondaryLabel="Explore the platform"
      />

      {availability ? (
        <section className="px-6 pb-4 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <ProductStatus status={availability.status} size="md" showDescription />
          </div>
        </section>
      ) : null}

      {demo ? <OperatingSystemDemo config={demo} /> : null}

      {demo ? (
        <section className="px-6 py-20 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
              How work moves
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
              A connected workflow, not a collection of disconnected features.
            </h2>

            <div className="mt-10 overflow-x-auto pb-2">
              <ol className="flex min-w-max items-center">
                {demo.workflow.map((step, index) => (
                  <li key={step} className="flex items-center">
                    <span className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                      {step}
                    </span>
                    {index < demo.workflow.length - 1 ? (
                      <ArrowRight
                        size={16}
                        className="mx-2 text-rinads-primary/60"
                        aria-hidden
                      />
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      ) : null}

      <ModuleGrid modules={content.modules} title={"What " + content.name + " coordinates"} />

      {demo ? (
        <section className="border-y border-[var(--border)] bg-black px-6 py-20 text-white md:px-12 lg:px-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <Bot size={24} className="text-rinads-primary" aria-hidden />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                  RINPO in {content.name}
                </p>
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">
                The interface changes with the operating context.
              </h2>
              <p className="mt-5 max-w-xl text-white/60">
                RINPO can explain the current workflow, surface relevant guidance, and route into supported product actions without creating a separate assistant for every Operating System.
              </p>
              <button
                type="button"
                onClick={() => openPhoneScreen("chat", demo.rinpoPrompt)}
                className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Ask RINPO
                <ArrowRight size={16} aria-hidden />
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                Example recommendation · demo only
              </p>
              <p className="mt-4 text-xl font-semibold">{demo.rinpoExample}</p>
              <div className="mt-6 flex gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-rinads-primary" aria-hidden />
                <p className="text-sm leading-6 text-white/55">
                  Recommendations do not grant execution authority. Any mutation still depends on the connected product&apos;s implemented tool, permission, confirmation, or runtime path.
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {content.related && content.related.length > 0 ? (
        <section className="px-6 py-16 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
              Continue through RINADS
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {content.related.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-rinads-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
                >
                  {link.label}
                  <ArrowRight size={14} aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <CTASection
        headline={"Operate with " + content.name + "."}
        summary="Explore the workflow with RINPO or start with RINADS to move into the connected platform."
      />
    </MarketingPageShell>
  );
}
