"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight } from "lucide-react";
import { Logo } from "@/components/rinads/Logo";
import { POSITIONING, CTAS } from "@/lib/product-ia";
import { trackMarketing } from "@/lib/analytics";

const ease = [0.16, 1, 0.3, 1] as const;

export function HomeHero() {
  const prefersReducedMotion = useReducedMotion();
  const enter = (delay: number) =>
    prefersReducedMotion
      ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.85, ease },
        };

  return (
    <section className="relative z-10 min-h-screen w-full overflow-hidden bg-black text-white">
      {/* Full-bleed atmosphere — brand aurora + soft circuit wash */}
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
      <motion.div
        className="pointer-events-none absolute -right-1/5 bottom-[-5%] h-[55vmin] w-[55vmin] rounded-full bg-[radial-gradient(circle,rgba(159,75,199,0.28)_0%,transparent_70%)] blur-2xl"
        aria-hidden
        animate={
          prefersReducedMotion
            ? undefined
            : { x: [0, -28, 16, 0], y: [0, -22, 12, 0], opacity: [0.35, 0.6, 0.4, 0.35] }
        }
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
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

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 pb-24 pt-36 md:px-12 lg:px-20">
        <motion.div {...enter(0.05)} className="flex flex-col items-start gap-5">
          <Logo tone="onDark" priority className="h-12 w-auto md:h-16 lg:h-[4.5rem]" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55 md:text-xs">
            RINADS TECHNOLOGIES
          </p>
        </motion.div>

        <motion.h1
          {...enter(0.18)}
          className="mt-10 max-w-4xl text-3xl font-semibold leading-[1.08] tracking-[-0.03em] text-white sm:text-4xl md:text-5xl lg:text-[3.35rem]"
        >
          {POSITIONING.hero}
        </motion.h1>

        <motion.p
          {...enter(0.3)}
          className="mt-6 max-w-2xl text-base leading-7 text-white/68 sm:text-lg"
        >
          {POSITIONING.support}
        </motion.p>

        <motion.div {...enter(0.42)} className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href={CTAS.primary.href}
            onClick={() => trackMarketing("demo_booking_started", { source: "home_hero" })}
            className="min-h-12 rounded-xl bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            {CTAS.primary.label}
          </Link>
          <Link
            href={CTAS.secondary.href}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            {CTAS.secondary.label}
            <ArrowDownRight size={16} aria-hidden />
          </Link>
        </motion.div>

        <motion.div
          {...enter(0.55)}
          className="mt-16 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40"
        >
          <span className="h-px w-10 bg-white/25" aria-hidden />
          Scroll to explore the platform
        </motion.div>
      </div>
    </section>
  );
}
