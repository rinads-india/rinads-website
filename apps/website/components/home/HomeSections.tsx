"use client";

import Link from "next/link";
import { WorkflowDiagram } from "@/components/system/WorkflowDiagram";
import { PlatformCard } from "@/components/system/PlatformCard";
import { VerticalCard } from "@/components/system/VerticalCard";
import { ServiceCard } from "@/components/system/ServiceCard";
import { CourseCard } from "@/components/system/CourseCard";
import { CTASection } from "@/components/system/CTASection";
import { RINPOOrb } from "@/components/system/RINPOOrb";
import { PLATFORM_OS } from "@/lib/product-ia";
import { ACADEMY_MODEL, ACADEMY_PROGRAMS } from "@/lib/content/academy";
import { VERTICALS, VERTICAL_EXAMPLES } from "@/lib/content/verticals";
import { SERVICE_LINES, RINPO_ROLES, RINPO_CHANNELS } from "@/lib/content/services";
import { CommercePreview } from "@/components/home/previews/CommercePreview";
import { LogisticsPreview } from "@/components/home/previews/LogisticsPreview";
import { MarketingPreview } from "@/components/home/previews/MarketingPreview";
import { BuildPreview } from "@/components/home/previews/BuildPreview";

export function HomeSections() {
  return (
    <>
      <section className="border-t border-white/10 px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">Architecture</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black text-foreground md:text-5xl">
            From experience to cloud — one stack.
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            RINPO is the interface. RINADS Intelligence is the brain. RINADS is the operating platform.
          </p>
          <div className="mt-10">
            <WorkflowDiagram />
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">Platform</p>
          <h2 className="mt-4 text-3xl font-black text-foreground md:text-5xl">Operating systems for business.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {PLATFORM_OS.map((os) => (
              <PlatformCard
                key={os.href}
                title={os.label}
                description={os.description ?? ""}
                href={os.href}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-black/20 px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <div className="mb-6">
              <RINPOOrb size="lg" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">RINPO</p>
            <h2 className="mt-4 text-3xl font-black text-foreground md:text-5xl">
              The persistent AI interface.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Assistant, tutor, operator, voice agent, phone agent, commerce assistant — one character identity across channels.
            </p>
            <Link href="/rinpo" className="mt-6 inline-block text-sm font-semibold text-rinads-primary hover:underline">
              Meet RINPO →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {RINPO_ROLES.map((role) => (
              <div key={role.name} className="border border-white/10 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{role.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{role.description}</p>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/45">Channels</p>
            <div className="flex flex-wrap gap-2">
              {RINPO_CHANNELS.map((ch) => (
                <span
                  key={ch}
                  className="rounded-full border border-rinads-primary/30 px-3 py-1 text-xs text-white/80"
                >
                  {ch}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">Product demos</p>
          <h2 className="mt-4 text-3xl font-black text-foreground md:text-5xl">See the platform in motion.</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <CommercePreview />
            <LogisticsPreview />
            <MarketingPreview />
            <BuildPreview />
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">Academy</p>
          <h2 className="mt-4 text-3xl font-black text-foreground md:text-5xl">Real Experience Academy.</h2>
          <div className="mt-8 flex flex-wrap gap-2">
            {ACADEMY_MODEL.map((step, i) => (
              <span key={step} className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="rounded-full border border-rinads-primary/40 px-3 py-1 text-rinads-primary">
                  {step}
                </span>
                {i < ACADEMY_MODEL.length - 1 ? <span className="text-white/30">→</span> : null}
              </span>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ACADEMY_PROGRAMS.slice(0, 6).map((program) => (
              <CourseCard
                key={program.slug}
                name={program.name}
                summary={program.summary}
                href={`/academy/${program.slug}`}
                formats={program.format}
              />
            ))}
          </div>
          <Link href="/academy" className="mt-8 inline-block text-sm font-semibold text-rinads-primary hover:underline">
            Explore Academy →
          </Link>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">Vertical OS</p>
          <h2 className="mt-4 text-3xl font-black text-foreground md:text-5xl">Business OS → Vertical OS</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            One RINADS core. Vertical configuration — not separate technology platforms for every industry.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {VERTICAL_EXAMPLES.map((name) => (
              <span key={name} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                {name}
              </span>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VERTICALS.map((v) => (
              <VerticalCard
                key={v.slug}
                name={v.name}
                type={v.type}
                summary={v.summary}
                href={`/solutions/${v.slug}`}
                status={v.status}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">Services</p>
          <h2 className="mt-4 text-3xl font-black text-foreground md:text-5xl">
            Build. Grow. Automate. Create. Transform. Train.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_LINES.map((s) => (
              <ServiceCard
                key={s.slug}
                name={s.name}
                verb={s.verb}
                summary={s.summary}
                href={`/services/${s.slug}`}
              />
            ))}
          </div>
        </div>
      </section>

      <CTASection
        headline="Enter the operating platform."
        summary="Talk to RINPO or start with RINADS — the front door to RUN, BUILD, GROW, LEARN, and AUTOMATE."
      />
    </>
  );
}
