"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { Megaphone, Code2, Bot } from "lucide-react";

const CARDS = [
  {
    title: "Digital Marketing",
    description: "SEO, Social Media, and Performance Ads that turn attention into growth.",
    details: ["SEO", "Social Media", "Performance Ads"],
    bg: "bg-[#1a1224]",
    accent: "from-rinads-primary/40",
    icon: Megaphone,
  },
  {
    title: "Custom Software Development",
    description: "Web Apps, Mobile Apps, and ERP systems built to run your business.",
    details: ["Web Apps", "Mobile Apps", "ERP Systems"],
    bg: "bg-[#241433]",
    accent: "from-rinads-primary/50",
    icon: Code2,
  },
  {
    title: "AI Automation",
    description: "Chatbots, workflow automation, and AI tools that simplify operations.",
    details: ["Chatbots", "Workflow Automation", "AI Tools"],
    bg: "bg-rinads-primary",
    accent: "from-white/20",
    icon: Bot,
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
  const start = index * 0.25;
  const end = start + 0.35;
  const y = useTransform(progress, [start, end], ["100%", "0%"]);
  const scale = useTransform(
    progress,
    [end, Math.min(end + 0.35, 1)],
    [1, 1 - (CARDS.length - 1 - index) * 0.05]
  );
  const Icon = card.icon;

  return (
    <motion.div
      style={{
        y,
        scale,
        top: index * 40,
        zIndex: index + 1,
      }}
      className={`absolute inset-x-0 h-full overflow-hidden rounded-3xl border border-rinads-primary/25 ${card.bg} will-change-transform shadow-2xl shadow-rinads-primary/20`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent} to-transparent opacity-40`}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative z-10 flex h-full flex-col justify-between p-8 md:p-12">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm">
          <Icon size={28} />
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
            0{index + 1}
          </p>
          <h3 className="text-3xl md:text-5xl font-black leading-tight text-white">
            {card.title}
          </h3>
          <p className="mt-4 max-w-md text-lg text-slate-200">{card.description}</p>
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold uppercase tracking-widest text-white/80">
            {card.details.map((d) => (
              <li key={d} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                {d}
              </li>
            ))}
          </ul>
        </div>
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
      className="relative z-40 h-[300vh] -mt-[100vh] bg-black"
    >
      <div className="sticky top-0 flex h-screen flex-col md:flex-row items-center gap-10 md:gap-16 px-6 md:px-12 lg:px-20 py-24 md:py-0">
        <div className="w-full md:w-2/5 shrink-0">
          <p className="mb-4 text-sm md:text-lg font-semibold uppercase tracking-[0.3em] text-rinads-primary">
            What we offer
          </p>
          <h2 className="text-4xl md:text-6xl font-black leading-tight text-white">
            Built to run businesses.
          </h2>
          <p className="mt-6 max-w-md text-lg text-slate-300">
            Marketing, software, and AI automation — unified under the RINADS®
            Business Cloud.
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
