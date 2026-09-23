"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  GraduationCap,
  Layers3,
  Sparkles,
} from "lucide-react";
import {
  MarketingPageShell,
  PageHero,
  CourseCard,
  CTASection,
} from "@/components/system";
import { ACADEMY_MODEL, ACADEMY_SUPPORT, ACADEMY_PROGRAMS } from "@/lib/content/academy";
import { getAcademyExperience } from "@/lib/academy-experience";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

const EVIDENCE_MODEL = [
  {
    title: "Practice evidence",
    description: "Exercises and critique show whether the learner can apply the concept.",
  },
  {
    title: "Work evidence",
    description: "Assignments are tied to realistic or real operating problems rather than quiz completion alone.",
  },
  {
    title: "Shipped evidence",
    description: "Projects, campaigns, systems, creative work, or business artifacts demonstrate execution.",
  },
  {
    title: "Measured improvement",
    description: "Progress is reviewed through skill evidence, quality, repeatability, and outcome.",
  },
] as const;

export function AcademyClient() {
  const { openPhoneScreen } = useRinpo();

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="RINADS Academy · Real Experience"
        headline="Learn by doing work that can be shipped."
        summary="RINADS Academy is designed around practice, real work, projects, evidence, and improvement — with RINPO as the persistent learning interface."
        primaryHref="/academy/programs"
        primaryLabel="Explore programs"
        secondaryHref="/platform/academy-os"
        secondaryLabel="Academy OS"
      />

      <section className="px-6 pb-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
            Learning operating model
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
            The course is not the outcome. Capability is.
          </h2>

          <div className="mt-10 overflow-x-auto pb-2">
            <ol className="flex min-w-max items-center">
              {ACADEMY_MODEL.map((step, index) => (
                <li key={step} className="flex items-center">
                  <span className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-rinads-primary">
                    {step}
                  </span>
                  {index < ACADEMY_MODEL.length - 1 ? (
                    <ArrowRight size={16} className="mx-2 text-rinads-primary/60" aria-hidden />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {ACADEMY_SUPPORT.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs text-[var(--text-muted)]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-black px-6 py-20 text-white md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <Bot size={24} className="text-rinads-primary" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                RINPO Tutor
              </p>
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">
              One tutor interface across the learning journey.
            </h2>
            <p className="mt-5 max-w-xl text-white/60">
              RINPO can help explain a concept, suggest practice, connect learning to a real task, and guide the learner toward the next useful piece of evidence.
            </p>
            <button
              type="button"
              onClick={() =>
                openPhoneScreen(
                  "chat",
                  "Help me choose a RINADS Academy learning path based on what I want to learn, practice, and ship."
                )
              }
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Ask RINPO
              <ArrowRight size={15} aria-hidden />
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
              Example learning loop
            </p>
            <div className="mt-5 space-y-3">
              {[
                ["Understand", "Explain the concept in the context of the learner's goal."],
                ["Practice", "Give a constrained exercise rather than more passive content."],
                ["Apply", "Move the skill into a real or realistic work problem."],
                ["Review", "Critique the output and identify the next improvement."],
              ].map(([title, detail], index) => (
                <div key={title} className="rounded-xl border border-white/10 bg-black/20 p-4">
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
            <p className="mt-5 text-xs leading-5 text-white/40">
              This public experience describes the learning model. It does not imply that every tutoring, assessment, or certification workflow is fully automated today.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start gap-3">
            <GraduationCap size={24} className="mt-1 text-rinads-primary" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                Schools & learning paths
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                Choose the capability you want to build.
              </h2>
              <p className="mt-4 max-w-2xl text-[var(--text-muted)]">
                Each path should connect learning to practice, work, and a shipped output rather than ending at content completion.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ACADEMY_PROGRAMS.map((program) => {
              const experience = getAcademyExperience(program.slug);
              return (
                <CourseCard
                  key={program.slug}
                  name={program.name}
                  summary={experience?.ship ?? program.summary}
                  href={`/academy/${program.slug}`}
                  formats={program.format}
                />
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-start gap-3">
            <Layers3 size={23} className="mt-1 text-rinads-primary" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
                Evidence of learning
              </p>
              <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
                Measure what the learner can actually do.
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {EVIDENCE_MODEL.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-rinads-primary" aria-hidden />
                  <h3 className="font-semibold text-[var(--text-primary)]">{item.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl rounded-3xl border border-rinads-primary/25 bg-rinads-primary/[0.05] p-6 md:p-8">
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-rinads-primary" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
              Academy + Platform
            </p>
          </div>
          <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-4xl">
            Learn inside the same ecosystem used to build and operate.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
            Academy can connect learning to Build OS, Creative OS, Marketing OS, Business OS, Automation OS, and RINPO so the learner can move from explanation into practical application.
          </p>
          <Link
            href="/platform/academy-os"
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-rinads-primary hover:underline"
          >
            Explore Academy OS
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </section>

      <CTASection
        headline="Learn. Practice. Work. Ship."
        summary="Choose a path, use RINPO as the learning interface, and build evidence through practical work."
      />
    </MarketingPageShell>
  );
}
