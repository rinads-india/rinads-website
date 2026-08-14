"use client";

import Image from "next/image";
import {
  GridOverlay,
  Navbar,
  Hero,
  Services,
  Portfolio,
  Footer,
} from "@/components/rinads";

export default function HomePage() {
  return (
    <>
      <GridOverlay />
      <Navbar />
      <main id="main">
        <Hero />
        <Services />
        <section
          id="about"
          className="relative z-40 bg-surface px-6 md:px-12 lg:px-20 py-24 md:py-32"
        >
          <div className="mx-auto max-w-7xl grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <div>
              <p className="mb-4 text-sm md:text-lg font-semibold uppercase tracking-[0.3em] text-rinads-primary">
                About RINADS
              </p>
              <h2 className="text-4xl md:text-6xl font-black leading-tight text-foreground">
                Business simplified.
              </h2>
              <p className="mt-8 max-w-xl text-lg text-muted-foreground">
                RINADS® is a software and growth company building Business Cloud,
                websites, marketing systems, and AI-powered automation — from
                India to the world.
              </p>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground/80">
                Software · Websites · Marketing · AI automation. Built to run
                businesses.
              </p>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-rinads-primary/30 shadow-[0_0_60px_rgba(159,75,199,0.2)]">
              <Image
                src="/assets/rinads-promo.png"
                alt="RINADS Business Cloud dashboard and services"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>
        <Portfolio />
        <Footer />
      </main>
    </>
  );
}
