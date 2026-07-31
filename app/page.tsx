"use client";

import {
  GridOverlay,
  Navbar,
  Hero,
  Services,
  Portfolio,
  Footer,
} from "@/components/outbox";

export default function HomePage() {
  return (
    <>
      <GridOverlay />
      <Navbar />
      <main>
        <Hero />
        <Services />
        <section id="about" className="relative z-40 bg-[#111] px-6 md:px-12 lg:px-20 py-24 md:py-32">
          <div className="mx-auto max-w-7xl">
            <p className="mb-4 text-sm md:text-lg font-semibold uppercase tracking-[0.3em] text-white/70">
              About
            </p>
            <h2 className="max-w-4xl text-4xl md:text-6xl font-black leading-tight text-white">
              We build brands that refuse to fit inside the expected.
            </h2>
            <p className="mt-8 max-w-2xl text-lg text-slate-400">
              OUTBOX is a creative studio crafting identity systems, digital
              campaigns, and immersive web experiences for ambitious brands.
            </p>
          </div>
        </section>
        <Portfolio />
        <Footer />
      </main>
    </>
  );
}
