"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const SOLUTIONS = [
  {
    name: "Business OS",
    category: "Platform",
    description: "One operating system for customers, work, finance, growth and automation.",
    image: "/assets/rinads-promo.png",
    href: "/business-os",
  },
  {
    name: "RINPO Intelligence",
    category: "Intelligence",
    description: "Understand what's happening and know what to do next.",
    image: "/assets/rinpo-avatar.png",
    objectPosition: "object-top",
    href: "/rinpo-intelligence",
  },
  {
    name: "Growth Marketing",
    category: "Services",
    description: "SEO, social, and performance ads that compound results.",
    image: "/assets/rinads-brand-kit.png",
    href: "/grow",
  },
  {
    name: "Custom Software",
    category: "Services",
    description: "Web, mobile, and ERP products engineered for scale.",
    image: "/assets/rinads-brand-board.png",
    href: "/services#build",
  },
  {
    name: "RINADS Cloud",
    category: "Platform",
    description: "Connected data, integrations, and ecosystem behind RINADS.",
    image: "/assets/rinads-brand-board.png",
    href: "/cloud",
  },
];

export function Portfolio() {
  const [active, setActive] = useState(0);

  return (
    <section
      id="work"
      className="relative z-40 min-h-screen bg-surface px-6 py-24 md:px-12 lg:px-20"
    >
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary md:text-lg">
          Proof
        </p>
        <h2 className="mb-12 text-4xl font-black leading-tight text-foreground md:mb-16 md:text-6xl">
          Real systems. Real client work.
        </h2>

        <div className="flex h-[75vh] flex-col gap-2 md:h-[60vh] md:flex-row md:gap-3">
          {SOLUTIONS.map((item, i) => {
            const isActive = active === i;
            return (
              <Link
                key={item.name}
                href={item.href}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className={`relative min-h-[3.5rem] overflow-hidden rounded-2xl border border-rinads-primary/20 text-left transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] ${
                  isActive
                    ? "flex-[4] opacity-100 md:flex-[5]"
                    : "flex-[1] opacity-80 hover:opacity-95"
                }`}
                aria-label={`View ${item.name}`}
              >
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className={`object-cover ${
                    "objectPosition" in item ? item.objectPosition : ""
                  } transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                    isActive
                      ? "scale-100 opacity-100 blur-none"
                      : "scale-105 opacity-50 blur-sm"
                  }`}
                />
                <div
                  className={`absolute inset-0 transition-all duration-700 ${
                    isActive
                      ? "bg-gradient-to-t from-black via-black/40 to-transparent"
                      : "bg-black/70"
                  }`}
                />
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rinads-primary md:text-sm">
                    {item.category}
                  </p>
                  <h3
                    className={`mt-2 whitespace-normal font-black text-white md:whitespace-nowrap ${
                      isActive ? "text-2xl md:text-4xl" : "text-lg md:text-xl"
                    }`}
                  >
                    {item.name}
                  </h3>
                  {isActive && (
                    <p className="mt-3 max-w-md text-sm text-slate-200 md:text-base">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
