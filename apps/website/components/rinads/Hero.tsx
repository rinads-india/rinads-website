"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const wrapperScale = useTransform(scrollYProgress, [0.75, 1], [1, 0.7]);
  const wrapperY = useTransform(scrollYProgress, [0.75, 1], [0, 80]);
  const wrapperRadius = useTransform(scrollYProgress, [0.75, 1], [0, 60]);
  const wrapperOpacity = useTransform(scrollYProgress, [0.75, 1], [1, 0]);

  const circle1Scale = useTransform(scrollYProgress, [0, 0.35], [0.5, 5]);
  const circle2Scale = useTransform(scrollYProgress, [0.08, 0.42], [0.5, 5]);
  const circle3Scale = useTransform(scrollYProgress, [0.16, 0.5], [0.5, 5]);
  const circle4Scale = useTransform(scrollYProgress, [0.24, 0.58], [0.5, 5]);
  const circlesOpacity = useTransform(scrollYProgress, [0.35, 0.55], [1, 0]);

  const markOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);
  const scrollCueOpacity = useTransform(scrollYProgress, [0, 0.04], [1, 0]);

  const content1Opacity = useTransform(
    scrollYProgress,
    [0.12, 0.2, 0.35, 0.45],
    [0, 1, 1, 0]
  );
  const content1Y = useTransform(
    scrollYProgress,
    [0.12, 0.2, 0.35, 0.45],
    [50, 0, 0, -50]
  );

  const content2Opacity = useTransform(scrollYProgress, [0.45, 0.55], [0, 1]);
  const content2Y = useTransform(scrollYProgress, [0.45, 0.55], [50, 0]);

  return (
    <section ref={containerRef} className="relative h-[320vh] z-10">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          style={{
            scale: wrapperScale,
            y: wrapperY,
            borderRadius: wrapperRadius,
            opacity: wrapperOpacity,
          }}
          className="relative h-full w-full overflow-hidden rinads-aurora will-change-transform"
        >
          {/* Soft purple energy streaks */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "conic-gradient(from 210deg at 50% 50%, transparent 0deg, rgba(159,75,199,0.25) 40deg, transparent 90deg, rgba(192,107,232,0.2) 180deg, transparent 240deg, rgba(159,75,199,0.18) 300deg, transparent 360deg)",
              mixBlendMode: "screen",
            }}
          />

          {/* Concentric purple circles */}
          <motion.div
            style={{ opacity: circlesOpacity }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              style={{ scale: circle4Scale }}
              className="absolute h-[28vmin] w-[28vmin] rounded-full bg-[#2a0f40] will-change-transform"
            />
            <motion.div
              style={{ scale: circle3Scale }}
              className="absolute h-[28vmin] w-[28vmin] rounded-full bg-[#4a1d6a] will-change-transform"
            />
            <motion.div
              style={{ scale: circle2Scale }}
              className="absolute h-[28vmin] w-[28vmin] rounded-full bg-[#7a35a0] will-change-transform"
            />
            <motion.div
              style={{ scale: circle1Scale }}
              className="absolute h-[28vmin] w-[28vmin] overflow-hidden rounded-full bg-rinads-primary will-change-transform shadow-[0_0_80px_rgba(159,75,199,0.55)]"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-50 mix-blend-overlay"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45), transparent 45%), linear-gradient(135deg, rgba(233,184,255,0.4), transparent 60%)",
                }}
              />
            </motion.div>
          </motion.div>

          {/* Giant R [•] S mark — circle forms the brand pulse between letters */}
          <motion.div
            style={{ opacity: markOpacity }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <span className="absolute right-[50%] mr-[14vmin] text-[30vmin] font-black leading-none tracking-tighter text-white">
              R
            </span>
            <span className="absolute left-[50%] ml-[11vmin] text-[30vmin] font-black leading-none tracking-tighter text-white">
              S
            </span>
            <span className="sr-only">Rinads — Business simplified</span>
          </motion.div>

          {/* Scroll cue so the first frame doesn't read as a dead end */}
          <motion.div
            style={{ opacity: scrollCueOpacity }}
            className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-2 md:bottom-10"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60 md:text-xs">
              Scroll to explore
            </span>
            <motion.span
              aria-hidden
              className="flex h-9 w-5 items-start justify-center rounded-full border border-white/30 p-1"
            >
              <motion.span
                className="h-1.5 w-1 rounded-full bg-rinads-primary"
                animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.span>
          </motion.div>

          {/* Content 1 */}
          <motion.div
            style={{ opacity: content1Opacity, y: content1Y }}
            className="absolute inset-0 z-10 flex items-center justify-center px-6"
          >
            <h1 className="max-w-5xl text-center text-6xl md:text-8xl font-black leading-tight text-white">
              Business simplified.
            </h1>
          </motion.div>

          {/* Content 2 */}
          <motion.div
            style={{ opacity: content2Opacity, y: content2Y }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 px-6"
          >
            <p className="text-sm md:text-lg font-semibold uppercase tracking-[0.3em] text-rinads-primary">
              RINADS® Business Cloud
            </p>
            <h2 className="max-w-5xl text-center text-4xl md:text-6xl font-black leading-tight text-white">
              Digital Marketing &amp; Custom Software
              <br className="hidden md:block" /> Solutions That Drive Growth.
            </h2>
            <div className="mt-2 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <a
                href="#contact"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-rinads-primary px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-[#b45fd9] hover:shadow-[0_0_30px_rgba(159,75,199,0.45)] sm:px-8 sm:text-sm"
              >
                Get a Free Consultation
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>
              <a
                href="#work"
                className="inline-flex items-center justify-center gap-3 rounded-full border-2 border-rinads-primary px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-rinads-primary/15 sm:px-8 sm:text-sm"
              >
                View Our Work
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
