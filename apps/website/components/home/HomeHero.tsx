"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/rinads/Logo";
import { POSITIONING } from "@/lib/product-ia";
import { CTAS } from "@/lib/ctas";
import { COMPANY_CONFIG } from "@/lib/content/companyConfig";
import { trackMarketing } from "@/lib/analytics";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

const ease = [0.16, 1, 0.3, 1] as const;

export function HomeHero() {
  const prefersReducedMotion = useReducedMotion();
  const { openPhoneScreen } = useRinpo();
  const enter = (delay: number) =>
    prefersReducedMotion
      ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.85, ease },
        };

  return (
    <section className="relative z-10 w-full overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 rinads-aurora opacity-55 motion-reduce:opacity-35" aria-hidden />
      <motion.div
        className="pointer-events-none absolute -left-1/4 top-[-10%] h-[70vmin] w-[70vmin] rounded-full bg-[radial-gradient(circle,rgba(93,212,255,0.14)_0%,transparent_68%)] blur-2xl"
        aria-hidden
        animate={
          prefersReducedMotion
            ? undefined
            : { x: [0, 36, -12, 0], y: [0, 18, -10, 0], opacity: [0.45, 0.7, 0.5, 0.45] }
        }
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-25 motion-reduce:opacity-12"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "linear-gradient(to bottom, black 40%, transparent 92%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 pb-16 pt-32 md:px-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12 lg:px-20 lg:pb-24 lg:pt-36">
        <div>
          <motion.div {...enter(0.05)} className="flex flex-col items-start gap-4">
            <Logo tone="onDark" priority className="h-12 w-auto md:h-14 lg:h-16" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55 md:text-xs">
              RINADS TECHNOLOGIES
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">
              {COMPANY_CONFIG.category}
            </p>
          </motion.div>

          <motion.h1
            {...enter(0.18)}
            className="mt-8 max-w-xl text-3xl font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-4xl md:text-5xl"
          >
            {POSITIONING.hero}
          </motion.h1>

          <motion.p
            {...enter(0.3)}
            className="mt-5 max-w-xl text-base leading-7 text-white/68 sm:text-lg"
          >
            {POSITIONING.support}
          </motion.p>

          <motion.div {...enter(0.42)} className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                trackMarketing("rinpo_opened", { source: "home_hero" });
                trackMarketing("hero_try_rinpo", { source: "home_hero" });
                openPhoneScreen("chat");
              }}
              className="min-h-12 rounded-xl bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              {CTAS.talkToRinpo.label}
            </button>
            <Link
              href={CTAS.exploreRinads.href}
              onClick={() => trackMarketing("homepage_view", { cta: "explore_rinads" })}
              className="inline-flex min-h-12 items-center rounded-xl border border-white/20 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
            >
              {CTAS.exploreRinads.label}
            </Link>
            <Link
              href={CTAS.bookDemo.href}
              onClick={() => trackMarketing("hero_book_demo", { source: "home_hero" })}
              className="inline-flex min-h-12 items-center rounded-xl px-4 py-3 text-sm font-semibold text-white/80 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
            >
              {CTAS.bookDemo.label}
            </Link>
          </motion.div>

          <motion.p
            {...enter(0.5)}
            className="mt-6 text-xs font-medium tracking-wide text-white/45 sm:text-sm"
          >
            {COMPANY_CONFIG.location.trustLine}
          </motion.p>
        </div>

        <motion.div {...enter(0.35)} className="relative mx-auto w-full max-w-md lg:mx-0" aria-label="RINPO">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/rinpo-full-body-transparent-v2.png"
            alt="RINPO — the RINADS AI assistant"
            width={420}
            height={520}
            className="mx-auto h-auto w-full max-w-[280px] object-contain md:max-w-[340px]"
            loading="eager"
            decoding="async"
          />
          <p className="mt-3 text-center text-xs font-medium text-white/50">
            RINPO · Demo character asset · Talk to open the Phone experience
          </p>
        </motion.div>
      </div>
    </section>
  );
}
