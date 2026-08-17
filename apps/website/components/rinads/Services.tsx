"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { Megaphone, Code2, Bot, type LucideIcon } from "lucide-react";
import type { ServiceCardContent } from "@rinads/cms";

const CARDS: Array<ServiceCardContent & { bg: string; accent: string; icon: LucideIcon }> = [
  {
    title: "Digital Marketing",
    description: "SEO, Social Media, and Performance Ads that turn attention into growth.",
    details: ["SEO", "Social Media", "Performance Ads"],
    bg: "bg-[#1a1224]",
    accent: "from-rinads-primary/40",
    icon: Megaphone,
    href: "/grow",
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
  const content = (
    <>
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
      <div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm md:h-14 md:w-14">
          <Icon size={26} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 md:mb-3 md:text-sm">
            0{index + 1}
          </p>
          <h3 className="text-2xl font-black leading-tight text-white md:text-5xl">
            {card.title}
          </h3>
          <p className="mt-3 max-w-md text-base text-slate-200 md:mt-4 md:text-lg">
            {card.description}
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold uppercase tracking-widest text-white/80 md:mt-5 md:text-sm">
            {card.details.map((d) => (
              <li key={d} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );

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
      {"href" in card && card.href ? (
        <Link href={card.href} className="relative block h-full">
          {content}
        </Link>
      ) : (
        content
      )}
    </motion.div>
  );
}

export function Services({ cards }: { cards?: ServiceCardContent[] }) {
  const resolvedCards = CARDS.map((defaults, index) => ({
    ...defaults,
    ...(cards?.[index] ?? {}),
    details: cards?.[index]?.details ?? defaults.details,
  }));
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      id="services"
      ref={containerRef}
      className="relative z-40 h-[300vh] bg-background"
    >
      <div className="sticky top-0 flex h-screen flex-col md:flex-row items-center gap-6 md:gap-16 px-6 md:px-12 lg:px-20 pt-24 pb-10 md:py-0">
        <div className="w-full md:w-2/5 shrink-0">
          <p className="mb-4 text-sm md:text-lg font-semibold uppercase tracking-[0.3em] text-rinads-primary">
            What we offer
          </p>
          <h2 className="text-4xl md:text-6xl font-black leading-tight text-foreground">
            Built to run businesses.
          </h2>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Marketing, software, and AI automation — unified under the RINADS®
            Business Cloud.
          </p>
        </div>

        <div className="relative w-full flex-1 md:w-3/5 md:flex-none md:h-[60vh]">
          {resolvedCards.map((card, i) => (
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
