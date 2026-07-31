"use client";

import { useState } from "react";

const PROJECTS = [
  {
    name: "EcoNexa",
    category: "Brand Identity",
    image:
      "https://strvid.nyc3.cdn.digitaloceanspaces.com/cloudinary/EcoNexa_w4kl4w.webp",
  },
  {
    name: "Bali Travel",
    category: "Digital Experience",
    image:
      "https://strvid.nyc3.cdn.digitaloceanspaces.com/cloudinary/Bali_travel_oxtsng.webp",
  },
  {
    name: "Calm",
    category: "Web Experience",
    image:
      "https://strvid.nyc3.cdn.digitaloceanspaces.com/cloudinary/Calm_Hero_fbj3b9.webp",
  },
  {
    name: "Northridge",
    category: "Brand System",
    image:
      "https://strvid.nyc3.cdn.digitaloceanspaces.com/cloudinary/Northridge_Hero_lltty5.webp",
  },
  {
    name: "Naturally",
    category: "E-Commerce",
    image:
      "https://strvid.nyc3.cdn.digitaloceanspaces.com/cloudinary/Naturally_Website_h5aq5g.webp",
  },
];

export function Portfolio() {
  const [active, setActive] = useState(0);

  return (
    <section id="work" className="relative z-40 min-h-screen bg-[#111] px-6 md:px-12 lg:px-20 py-24">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-sm md:text-lg font-semibold uppercase tracking-[0.3em] text-white/70">
          Featured Work
        </p>
        <h2 className="mb-12 md:mb-16 text-4xl md:text-6xl font-black leading-tight text-white">
          Selected Projects.
        </h2>

        <div className="flex h-[75vh] md:h-[60vh] flex-col md:flex-row gap-2 md:gap-3">
          {PROJECTS.map((project, i) => {
            const isActive = active === i;
            return (
              <button
                key={project.name}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className={`relative overflow-hidden rounded-2xl text-left transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  isActive
                    ? "flex-[4] md:flex-[5] opacity-100"
                    : "flex-[1] opacity-80"
                }`}
                aria-label={`View ${project.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image}
                  alt={project.name}
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                    isActive ? "opacity-100 blur-none scale-100" : "opacity-50 blur-sm scale-105"
                  }`}
                />
                <div
                  className={`absolute inset-0 transition-all duration-700 ${
                    isActive
                      ? "bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                      : "bg-black/60"
                  }`}
                />
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-8">
                  <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                    {project.category}
                  </p>
                  <h3
                    className={`mt-2 font-black text-white whitespace-normal md:whitespace-nowrap ${
                      isActive ? "text-2xl md:text-4xl" : "text-lg md:text-xl"
                    }`}
                  >
                    {project.name}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
