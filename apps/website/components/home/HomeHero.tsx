"use client";

import Link from "next/link";
import Image from "next/image";
import { CommandBar } from "@/components/system/CommandBar";
import { Logo } from "@/components/rinads/Logo";
import { POSITIONING, CTAS } from "@/lib/product-ia";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

export function HomeHero() {
  const { openPhoneScreen } = useRinpo();

  return (
    <section className="relative z-10 min-h-screen w-full overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 rinads-aurora opacity-50" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" aria-hidden />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-end px-6 pb-16 pt-32 md:px-12 md:pb-20 lg:px-20">
        <div className="mb-8 flex items-center gap-4">
          <Logo className="h-10 brightness-0 invert md:h-12" priority />
          <span className="hidden text-xs font-semibold uppercase tracking-[0.35em] text-white/50 sm:inline">
            Powered by RINPO
          </span>
        </div>

        <h1 className="max-w-5xl text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          {POSITIONING.hero}
        </h1>
        <p className="mt-6 max-w-2xl text-base text-white/75 sm:text-lg md:text-xl">
          {POSITIONING.support}
        </p>
        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.25em] text-rinads-primary">
          {POSITIONING.closing}
        </p>

        <div className="mt-10">
          <CommandBar />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => openPhoneScreen("chat")}
            className="rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
          >
            {CTAS.primary.label}
          </button>
          <Link
            href={CTAS.secondary.href}
            className="rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-rinads-primary/50"
          >
            {CTAS.secondary.label}
          </Link>
          <Link
            href="/platform"
            className="rounded-full px-6 py-3 text-sm font-semibold text-white/70 transition hover:text-white"
          >
            Explore the platform
          </Link>
        </div>

        <div className="mt-12 flex items-center gap-3 opacity-60">
          <Image src="/assets/rinpo-head.png" alt="" width={40} height={40} className="rounded-full" aria-hidden />
          <p className="text-sm text-white/70">Interactive RINPO interface — ask, command, operate.</p>
        </div>
      </div>
    </section>
  );
}
