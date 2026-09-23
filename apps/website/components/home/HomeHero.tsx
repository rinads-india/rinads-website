"use client";

import Link from "next/link";
import { ArrowDownRight, Sparkles } from "lucide-react";
import { CommandBar } from "@/components/system/CommandBar";
import { POSITIONING, CTAS } from "@/lib/product-ia";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

export function HomeHero() {
  const { openPhoneScreen } = useRinpo();

  return (
    <section className="relative z-10 min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 rinads-aurora opacity-45" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
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
          <Sparkles size={14} className="text-rinads-primary" aria-hidden />
          RINADS · AI Operating Platform
        </div>

        <h1 className="mt-8 max-w-5xl text-5xl font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl md:text-7xl lg:text-[5.6rem]">
          {POSITIONING.hero}
        </h1>

        <p className="mt-7 max-w-3xl text-base leading-7 text-white/70 sm:text-lg md:text-xl">
          Run your business, build software, grow your brand, automate operations, and train people through one connected platform.
        </p>

        <p className="mt-4 text-sm font-semibold text-rinads-primary">
          RINPO is the interface. RINADS Intelligence is the brain.
        </p>

        <div className="mt-10">
          <CommandBar placeholder="Ask RINPO what you want to accomplish…" />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => openPhoneScreen("chat")}
            className="min-h-12 rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            {CTAS.primary.label}
          </button>
          <a
            href="#platform-demo"
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:border-rinads-primary/50 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            See platform demo
            <ArrowDownRight size={16} aria-hidden />
          </a>
          <Link
            href="/platform"
            className="min-h-12 rounded-full px-6 py-3 text-sm font-semibold text-white/65 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
          >
            Explore the platform
          </Link>
        </div>

        <div className="mt-14 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
          {[
            ["Run", "Business operations"],
            ["Build", "Software systems"],
            ["Grow", "Marketing & commerce"],
            ["Automate", "Connected workflows"],
          ].map(([title, detail]) => (
            <div key={title} className="bg-black/70 px-4 py-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">{title}</p>
              <p className="mt-1 text-xs text-white/50">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
