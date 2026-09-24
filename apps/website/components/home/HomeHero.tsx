"use client";

import Link from "next/link";
import { ArrowDownRight } from "lucide-react";
import { CommandBar } from "@/components/system/CommandBar";
import { POSITIONING, CTAS } from "@/lib/product-ia";
import { trackMarketing } from "@/lib/analytics";

export function HomeHero() {
  return (
    <section className="relative z-10 min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 rinads-aurora opacity-45 motion-reduce:opacity-30" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-30 motion-reduce:opacity-15"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "linear-gradient(to bottom, black, transparent 80%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/35 to-black" aria-hidden />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 pb-20 pt-36 md:px-12 lg:px-20">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65 backdrop-blur">
          RINADS · AI Operating Platform
        </div>

        <h1 className="mt-8 max-w-5xl text-5xl font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl lg:text-[5.6rem]">
          {POSITIONING.hero}
        </h1>

        <p className="mt-7 max-w-3xl text-base leading-7 text-white/70 sm:text-lg md:text-xl">
          {POSITIONING.support}
        </p>

        <div className="mt-10">
          <CommandBar placeholder="Ask RINPO what needs attention…" />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={CTAS.primary.href}
            onClick={() => trackMarketing("demo_booking_started", { source: "home_hero" })}
            className="min-h-12 rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            {CTAS.primary.label}
          </Link>
          <Link
            href={CTAS.secondary.href}
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:border-rinads-primary/50 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            {CTAS.secondary.label}
            <ArrowDownRight size={16} aria-hidden />
          </Link>
          <Link
            href={CTAS.signIn.href}
            className="min-h-12 rounded-full px-6 py-3 text-sm font-semibold text-white/65 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            {CTAS.signIn.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
