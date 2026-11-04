"use client";

import "@/app/grow/grow.css";
import Link from "next/link";
import { Navbar } from "@/components/rinads/Navbar";
import { ScrollVideo } from "@/components/grow/ScrollVideo";
import { GrowSectionOne } from "@/components/grow/GrowSectionOne";
import { GrowSectionTwo } from "@/components/grow/GrowSectionTwo";

const GROW_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4";

export function GrowClient() {
  return (
    <main id="main" className="grow-page font-inter">
      <ScrollVideo src={GROW_VIDEO} />
      <div className="relative z-10">
        <Navbar />
        <GrowSectionOne />
        <div aria-hidden className="h-[80vh]" />
        <GrowSectionTwo />
        <section className="relative mx-auto max-w-6xl px-6 pb-24 text-white md:px-12" aria-labelledby="search-visibility-title">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-7 backdrop-blur-sm md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-300">RI GROWTH · Pilot</p>
            <h2 id="search-visibility-title" className="mt-3 text-2xl font-bold md:text-4xl">Be easier to find. Make every enquiry count.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 md:text-base">
              Start with search visibility, useful content and measurable leads. RI GROWTH Search Intelligence is in pilot planning—not an active Google data connection.
            </p>
            <Link
              href="/grow/search-intelligence"
              className="mt-6 inline-flex rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
            >
              Explore Search Intelligence
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
