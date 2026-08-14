"use client";

import Image from "next/image";
import { useState } from "react";

const SOLUTIONS = [
  {
    name: "Business Cloud",
    category: "Platform",
    description: "AI-powered systems built to run your business end to end.",
    image: "/assets/rinads-promo.png",
  },
  {
    name: "Growth Marketing",
    category: "Digital Marketing",
    description: "SEO, social, and performance ads that compound results.",
    image: "/assets/rinads-brand-kit.png",
  },
  {
    name: "Custom Software",
    category: "Development",
    description: "Web, mobile, and ERP products engineered for scale.",
    image: "/assets/rinads-brand-board.png",
  },
  {
    name: "RINPO Intelligence",
    category: "AI Automation",
    description: "Conversational AI and workflow automation for teams.",
    image: "/assets/rinpo-avatar.png",
    objectPosition: "object-top",
  },
  {
    name: "Brand Systems",
    category: "Identity",
    description: "Purple-forward visual systems that feel unmistakably Rinads.",
    image: "/assets/rinads-brand-board.png",
  },
];

export function Portfolio() {
  const [active, setActive] = useState(0);

  return (
    <section
      id="work"
      className="relative z-40 min-h-screen bg-[#0a0a0a] px-6 md:px-12 lg:px-20 py-24"
    >
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm md:text-lg font-semibold uppercase tracking-[0.3em] text-rinads-primary">
          Solutions
        </p>
        <h2 className="mb-12 md:mb-16 text-4xl md:text-6xl font-black leading-tight text-white">
          How we simplify business.
        </h2>

        <div className="flex h-[75vh] md:h-[60vh] flex-col md:flex-row gap-2 md:gap-3">
          {SOLUTIONS.map((item, i) => {
            const isActive = active === i;
            return (
              <button
                key={item.name}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className={`relative min-h-[3.5rem] overflow-hidden rounded-2xl border border-rinads-primary/20 text-left transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] ${
                  isActive
                    ? "flex-[4] md:flex-[5] opacity-100"
                    : "flex-[1] opacity-80 hover:opacity-95"
                }`}
                aria-expanded={isActive}
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
                      ? "opacity-100 blur-none scale-100"
                      : "opacity-50 blur-sm scale-105"
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
                  <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.3em] text-rinads-primary">
                    {item.category}
                  </p>
                  <h3
                    className={`mt-2 font-black text-white whitespace-normal md:whitespace-nowrap ${
                      isActive ? "text-2xl md:text-4xl" : "text-lg md:text-xl"
                    }`}
                  >
                    {item.name}
                  </h3>
                  {isActive && (
                    <p className="mt-3 max-w-md text-sm md:text-base text-slate-200">
                      {item.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
