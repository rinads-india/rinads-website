"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { useAuth } from "@/contexts/AuthContext";
import { Reveal } from "./Reveal";

const SERVICES = ["SEO & CONTENT", "PAID MEDIA", "SOCIAL GROWTH"];

export function GrowSectionOne() {
  const { openPhoneScreen } = useRinpo();
  const { isAuthenticated } = useAuth();

  return (
    <section className="relative flex min-h-screen flex-col justify-end px-6 pb-16 pt-24 sm:px-10 sm:pt-28 md:px-16 md:pb-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <Reveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              RINADS Grow
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Clear. Precise.{" "}
              <span className="text-rinads-primary">Growing.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-base text-white/75 sm:text-lg">
              Marketing that scales with intelligence — browse SEO, paid media, and social
              growth packages, buy through RINADS, and manage campaigns inside Business OS.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60 sm:text-xs">
              {SERVICES.map((service) => (
                <span key={service} className="flex items-center gap-2">
                  <span className="text-rinads-primary">/</span>
                  {service}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={320}>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Start a campaign
                <ArrowUpRight size={16} aria-hidden />
              </Link>
              {isAuthenticated ? (
                <Link
                  href="/os?module=grow"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:border-rinads-primary/50 hover:text-rinads-primary"
                >
                  Manage in Business OS
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openPhoneScreen("chat", "Tell me about RINADS Grow marketing packages.")}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:border-rinads-primary/50 hover:text-rinads-primary"
                >
                  Free consultation
                </button>
              )}
            </div>
          </Reveal>
        </div>

        <Reveal delay={400} className="w-full max-w-sm lg:max-w-xs">
          <div className="grow-glass rounded-3xl p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/15">
                <Image
                  src="/assets/rinpo-avatar.png"
                  alt="RINPO"
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Talk with RINPO</p>
                <p className="text-xs text-white/60">Intelligence lead, RINADS Grow</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              Need a growth plan? RINPO maps your funnel, channels, and budget into a campaign
              blueprint you can launch from Business OS.
            </p>
            <button
              type="button"
              onClick={() => openPhoneScreen("chat", "Help me plan a RINADS Grow campaign.")}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rinads-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
            >
              Chat with RINPO
              <ArrowUpRight size={16} aria-hidden />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
