"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

const CARDS = [
  {
    title: "Brand Identity",
    description:
      "Distinctive visual systems and narrative that make brands unforgettable.",
    bg: "bg-slate-800",
    video:
      "https://strvid.nyc3.cdn.digitaloceanspaces.com/cloudinary/bg5_yx7j4k.mp4",
  },
  {
    title: "Digital Marketing",
    description:
      "Performance-driven campaigns that turn attention into lasting growth.",
    bg: "bg-slate-700",
    video:
      "https://strvid.nyc3.cdn.digitaloceanspaces.com/cloudinary/bg2_zvj76l.mp4",
  },
  {
    title: "Web Experience",
    description:
      "Immersive digital products engineered for clarity, speed, and delight.",
    bg: "bg-brand-orange",
    video:
      "https://strvid.nyc3.cdn.digitaloceanspaces.com/cloudinary/bg3_fqnvi9.mp4",
  },
];

function ServiceCard({
  card,
  index,
  progress,
}: {
  card: (typeof CARDS)[number];
  index: number;
  progress: MotionValue<number>;
}) {
  // Each card slides up in sequence across the scroll range
  const start = index * 0.25;
  const end = start + 0.35;
  const y = useTransform(progress, [start, end], ["100%", "0%"]);

  // Underlying cards scale down as later cards stack on top
  const scale = useTransform(
    progress,
    [end, Math.min(end + 0.35, 1)],
    [1, 1 - (CARDS.length - 1 - index) * 0.05]
  );

  return (
    <motion.div
      style={{
        y,
        scale,
        top: index * 40,
        zIndex: index + 1,
      }}
      className={`absolute inset-x-0 h-full overflow-hidden rounded-3xl ${card.bg} will-change-transform shadow-2xl`}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
        src={card.video}
      />
      <div className="relative z-10 flex h-full flex-col justify-end p-8 md:p-12">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
          0{index + 1}
        </p>
        <h3 className="text-3xl md:text-5xl font-black leading-tight text-white">
          {card.title}
        </h3>
        <p className="mt-4 max-w-md text-lg text-slate-200">{card.description}</p>
      </div>
    </motion.div>
  );
}

export function Services() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      id="services"
      ref={containerRef}
      className="relative z-40 h-[300vh] -mt-[100vh] bg-brand-darker"
    >
      <div className="sticky top-0 flex h-screen flex-col md:flex-row items-center gap-10 md:gap-16 px-6 md:px-12 lg:px-20 py-24 md:py-0">
        <div className="w-full md:w-2/5 shrink-0">
          <p className="mb-4 text-sm md:text-lg font-semibold uppercase tracking-[0.3em] text-white/70">
            What we do
          </p>
          <h2 className="text-4xl md:text-6xl font-black leading-tight text-white">
            Our Core Expertise.
          </h2>
          <p className="mt-6 max-w-md text-lg text-slate-200">
            Strategy, craft, and technology fused into experiences that move
            brands forward.
          </p>
        </div>

        <div className="relative w-full md:w-3/5 h-[60vh]">
          {CARDS.map((card, i) => (
            <ServiceCard
              key={card.title}
              card={card}
              index={i}
              progress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
