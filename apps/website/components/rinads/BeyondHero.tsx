"use client";

import { useEffect, useRef, useState } from "react";
import { Poppins } from "next/font/google";

const RINPO_FULL_BODY = "/assets/rinpo-full-body.png";
const RINPO_FULL_BODY_WIDTH = 471;
const RINPO_FULL_BODY_HEIGHT = 1334;

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500"],
});

const LEFT_WORDS = ["cloud", "simplify", "evolve", "build"];
const RIGHT_WORDS = ["rinpo", "genesis", "purpose", "ignite"];

const TITLE_LAYERS = [
  { color: "#5DD4FF", translateClass: "translate-y-[18px] md:translate-y-[36px]" },
  { color: "#9F4BC7", translateClass: "translate-y-[12px] md:translate-y-[24px]" },
  { color: "#C06BE8", translateClass: "translate-y-[6px] md:translate-y-[12px]" },
  { color: "#FFFFFF", translateClass: "translate-y-0" },
] as const;

function clamp(min: number, max: number, value: number) {
  return Math.min(max, Math.max(min, value));
}

function useBeyondScroll(sectionRef: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  const [scaleFactor, setScaleFactor] = useState(1);

  useEffect(() => {
    const update = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight;
      const innerHeight = window.innerHeight;
      const range = sectionHeight - innerHeight;
      const p = range > 0 ? clamp(0, 1, -rect.top / range) : 0;
      setProgress(p);
      setScaleFactor(window.innerWidth < 768 ? 0.5 : 1);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sectionRef]);

  const getLeftOffset = (index: number) =>
    -(60 + index * 40) * scaleFactor * (1 - progress);
  const getRightOffset = (index: number) =>
    (60 + index * 40) * scaleFactor * (1 - progress);
  const opacity = 0.35 + progress * 0.65;

  return { getLeftOffset, getRightOffset, opacity };
}

export function BeyondHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { getLeftOffset, getRightOffset, opacity } = useBeyondScroll(sectionRef);

  return (
    <section
      ref={sectionRef}
      aria-label="RINADS Hero"
      className="relative z-10 w-full overflow-hidden font-inter"
      style={{ height: "120vh", backgroundColor: "#9F4BC7" }}
    >
      <div className="beyond-rinpo-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={RINPO_FULL_BODY}
          alt=""
          width={RINPO_FULL_BODY_WIDTH}
          height={RINPO_FULL_BODY_HEIGHT}
          decoding="async"
          fetchPriority="high"
          className="beyond-rinpo-figure"
        />
      </div>

      <div className="beyond-hero-sticky sticky top-0 z-[5] h-screen w-full">
        <div className="absolute inset-0 flex items-start justify-center pt-[11vh] md:pt-[3vh]">
          <div className="relative">
            {TITLE_LAYERS.map((layer, index) => {
              const isFront = index === TITLE_LAYERS.length - 1;
              return (
                <h1
                  key={layer.color}
                  className={`beyond-display select-none text-[clamp(7.5rem,30vw,28rem)] leading-[0.85] tracking-tight ${layer.translateClass} ${
                    isFront ? "relative" : "absolute inset-0"
                  }`}
                  style={{ color: layer.color }}
                >
                  RINADS
                </h1>
              );
            })}
          </div>
        </div>

        <div
          className={`beyond-side-words pointer-events-none absolute inset-0 flex items-end justify-between px-[3vw] md:px-[6vw] ${poppins.className}`}
        >
          <div className="flex flex-col gap-2 md:gap-3">
            {LEFT_WORDS.map((word, index) => (
              <span
                key={word}
                className="text-sm uppercase text-white/80 md:text-base lg:text-lg"
                style={{
                  transform: `translateX(${getLeftOffset(index)}px)`,
                  opacity,
                }}
              >
                {word}
              </span>
            ))}
          </div>
          <div className="flex flex-col items-end gap-2 md:gap-3">
            {RIGHT_WORDS.map((word, index) => (
              <span
                key={word}
                className="text-sm uppercase text-white/80 md:text-base lg:text-lg"
                style={{
                  transform: `translateX(${getRightOffset(index)}px)`,
                  opacity,
                }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
