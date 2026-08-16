"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { Reveal } from "./Reveal";

const CAPABILITIES = [
  {
    id: "01",
    title: "Campaign vision",
    body: "Position your brand, audience, and offer into a launch-ready growth narrative.",
  },
  {
    id: "02",
    title: "Layered analytics",
    body: "Track acquisition, engagement, and revenue signals across every channel in one view.",
  },
  {
    id: "03",
    title: "Adaptive spend",
    body: "Shift budget toward what converts — SEO, paid media, and social tuned in real time.",
  },
];

const PACKAGES = [
  {
    id: "seo-starter",
    name: "SEO Starter",
    price: "From ₹24,999/mo",
    summary: "Technical audit, keyword map, and on-page optimization sprint.",
  },
  {
    id: "ads-sprint",
    name: "Ads Sprint",
    price: "From ₹39,999/mo",
    summary: "Paid search and social campaigns with weekly creative refresh.",
  },
  {
    id: "social-pack",
    name: "Social Pack",
    price: "From ₹18,999/mo",
    summary: "Content calendar, community management, and performance reporting.",
  },
];

export function GrowSectionTwo() {
  const [packagesOpen, setPackagesOpen] = useState(false);

  return (
    <section className="relative flex min-h-screen flex-col justify-center px-6 py-20 sm:px-10 md:px-16">
      <div className="mx-auto w-full max-w-6xl">
        <Reveal>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-rinads-primary">
            Capabilities
          </p>
          <h2 className="max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl md:text-5xl">
            Growth systems built for operators, not vanity metrics.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {CAPABILITIES.map((item, index) => (
            <Reveal key={item.id} delay={index * 100}>
              <article className="grow-glass h-full rounded-3xl p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                  {item.id}
                </p>
                <h3 className="mt-3 text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={350}>
          <div className="mt-12 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setPackagesOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Explore packages
              <ArrowUpRight size={16} aria-hidden />
            </button>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:border-rinads-primary/50 hover:text-rinads-primary"
            >
              Free consultation
            </Link>
          </div>
        </Reveal>
      </div>

      {packagesOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div
            className="grow-glass w-full max-w-lg rounded-3xl p-6 shadow-2xl"
            role="dialog"
            aria-labelledby="grow-packages-title"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rinads-primary">
                  Marketplace
                </p>
                <h3 id="grow-packages-title" className="mt-1 text-xl font-bold text-white">
                  Browse packages
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPackagesOpen(false)}
                aria-label="Close packages"
                className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <ul className="space-y-3">
              {PACKAGES.map((pkg) => (
                <li
                  key={pkg.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{pkg.name}</p>
                      <p className="mt-1 text-xs text-white/60">{pkg.summary}</p>
                      <p className="mt-2 text-sm font-medium text-rinads-primary">{pkg.price}</p>
                    </div>
                    <Link
                      href="/signup?next=/os"
                      className="shrink-0 rounded-full bg-rinads-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-rinads-primary-dark"
                    >
                      Buy
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-xs text-white/50">
              Checkout connects to Business OS storefront in a future release. Sign up to reserve
              your workspace.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
