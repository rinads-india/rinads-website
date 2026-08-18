"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RinpoOrbFace } from "@/components/rinpo/RinpoOrbFace";

const LANDING_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260717_120352_eb988725-1351-43b3-8095-16e4a1005e3d.mp4";

const PILL_MODULES = ["CRM", "Projects", "Finance", "Marketing", "Automation", "Intelligence"];

export function HomeHero() {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <section className="relative z-10 min-h-screen w-full bg-black p-3 font-inter md:p-4">
      <div className="relative flex min-h-[calc(100vh-24px)] w-full flex-col overflow-hidden rounded-2xl bg-black">
        {!videoFailed ? (
          <video
            src={LANDING_VIDEO}
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoFailed(true)}
            className="anim-fade absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="anim-fade rinads-aurora absolute inset-0" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

        <nav className="relative z-10 flex items-center justify-end px-6 pt-16 md:px-10 md:pt-20">
          <div className="flex items-center gap-3">
            <Link
              href="/business-os"
              className="btn-cut-border hidden px-5 py-2.5 text-sm text-white hover:bg-white/10 md:block"
            >
              <span>Explore Business OS</span>
            </Link>
            <a
              href="#connected-workflow"
              className="btn-cut hidden bg-white px-5 py-2.5 text-sm text-black hover:bg-white/90 md:block"
            >
              See how it works
            </a>
          </div>
        </nav>

        <div className="relative z-10 flex flex-1 flex-col justify-end px-6 pb-10 md:px-10 md:pb-14">
          <div className="mb-6 flex items-end gap-2 opacity-40 md:mb-8">
            <span className="text-6xl font-black text-white md:text-8xl">R</span>
            <RinpoOrbFace className="h-12 w-12 md:h-16 md:w-16" />
            <span className="text-6xl font-black text-white md:text-8xl">S</span>
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Run your business from one place.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-white/75 sm:text-lg md:text-xl">
            RINADS Business OS connects your customers, work, finance, marketing and automation into
            one intelligent workspace.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/business-os"
              className="inline-flex items-center gap-2 rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
            >
              Explore Business OS
              <ArrowRight size={16} aria-hidden />
            </Link>
            <a
              href="#connected-workflow"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:border-rinads-primary/50"
            >
              See how it works
            </a>
          </div>

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
            {PILL_MODULES.join(" · ")}
          </p>
        </div>
      </div>
    </section>
  );
}
