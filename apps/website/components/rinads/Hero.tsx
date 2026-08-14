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

  // Expanding rings live *behind* the R•S lockup and stay gone once copy is on.
  const circle1Scale = useTransform(scrollYProgress, [0.08, 0.38], [1, 9]);
  const circle2Scale = useTransform(scrollYProgress, [0.14, 0.44], [1, 9]);
  const circle3Scale = useTransform(scrollYProgress, [0.2, 0.5], [1, 9]);
  const circle4Scale = useTransform(scrollYProgress, [0.26, 0.54], [1, 9]);
  const circlesOpacity = useTransform(scrollYProgress, [0.08, 0.12, 0.4, 0.5], [0, 1, 1, 0]);

  // R • S must read on the first frame, then be fully gone before any headline.
  const markOpacity = useTransform(scrollYProgress, [0, 0.1, 0.16], [1, 1, 0]);
  const markVisibility = useTransform(markOpacity, (v) => (v < 0.02 ? "hidden" : "visible"));
  const scrollCueOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  const content1Opacity = useTransform(
    scrollYProgress,
    [0.18, 0.26, 0.38, 0.46],
    [0, 1, 1, 0]
  );
  const content1Y = useTransform(scrollYProgress, [0.18, 0.26, 0.38, 0.46], [40, 0, 0, -40]);
  const content1Visibility = useTransform(content1Opacity, (v) =>
    v < 0.02 ? "hidden" : "visible"
  );

  const content2Opacity = useTransform(scrollYProgress, [0.48, 0.58], [0, 1]);
  const content2Y = useTransform(scrollYProgress, [0.48, 0.58], [40, 0]);
  const content2Visibility = useTransform(content2Opacity, (v) =>
    v < 0.02 ? "hidden" : "visible"
  );

  return (
    <section ref={containerRef} className="relative z-10 h-[320vh]">
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
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "conic-gradient(from 210deg at 50% 50%, transparent 0deg, rgba(159,75,199,0.25) 40deg, transparent 90deg, rgba(192,107,232,0.2) 180deg, transparent 240deg, rgba(159,75,199,0.18) 300deg, transparent 360deg)",
              mixBlendMode: "screen",
            }}
          />

          {/* Expanding rings — start hidden so they cannot cover R•S on load */}
          <motion.div
            style={{ opacity: circlesOpacity }}
            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
          >
            <motion.div
              style={{ scale: circle4Scale }}
              className="absolute h-[16vmin] w-[16vmin] rounded-full bg-[#2a0f40] will-change-transform sm:h-[18vmin] sm:w-[18vmin]"
            />
            <motion.div
              style={{ scale: circle3Scale }}
              className="absolute h-[16vmin] w-[16vmin] rounded-full bg-[#4a1d6a] will-change-transform sm:h-[18vmin] sm:w-[18vmin]"
            />
            <motion.div
              style={{ scale: circle2Scale }}
              className="absolute h-[16vmin] w-[16vmin] rounded-full bg-[#7a35a0] will-change-transform sm:h-[18vmin] sm:w-[18vmin]"
            />
            <motion.div
              style={{ scale: circle1Scale }}
              className="absolute h-[16vmin] w-[16vmin] rounded-full bg-rinads-primary will-change-transform sm:h-[18vmin] sm:w-[18vmin]"
            />
          </motion.div>

          {/* First-frame brand mark: R + orb + S (reads as ROS) */}
          <motion.div
            style={{ opacity: markOpacity, visibility: markVisibility }}
            className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-4"
          >
            <div className="flex items-center justify-center gap-[3vw] sm:gap-[2.5vw]">
              <span className="text-[22vw] font-black leading-none tracking-tighter text-white sm:text-[18vw] md:text-[16vw]">
                R
              </span>
              <span
                aria-hidden
                className="inline-block h-[16vw] w-[16vw] shrink-0 rounded-full bg-rinads-primary shadow-[0_0_60px_rgba(159,75,199,0.55)] sm:h-[14vw] sm:w-[14vw] md:h-[12vw] md:w-[12vw]"
              />
              <span className="text-[22vw] font-black leading-none tracking-tighter text-white sm:text-[18vw] md:text-[16vw]">
                S
              </span>
            </div>
            <span className="sr-only">Rinads — Business simplified</span>
          </motion.div>

          <motion.div
            style={{ opacity: scrollCueOpacity }}
            className="pointer-events-none absolute inset-x-0 bottom-28 z-[2] flex flex-col items-center gap-2 sm:bottom-10"
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

          <motion.div
            style={{ opacity: content1Opacity, y: content1Y, visibility: content1Visibility }}
            className="absolute inset-0 z-10 flex items-center justify-center px-6 opacity-0"
          >
            <h1 className="max-w-5xl text-center text-5xl font-black leading-tight text-white sm:text-6xl md:text-8xl">
              Business simplified.
            </h1>
          </motion.div>

          {/* pb/pl keep copy and CTAs clear of the fixed RINPO launcher on phones */}
          <motion.div
            style={{ opacity: content2Opacity, y: content2Y, visibility: content2Visibility }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 px-6 pb-36 pt-24 opacity-0 sm:gap-6 sm:pb-16 md:pb-10"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rinads-primary sm:text-sm md:text-lg">
              RINADS® Business Cloud
            </p>
            <h2 className="max-w-5xl text-center text-3xl font-black leading-tight text-white sm:text-4xl md:text-6xl">
              Digital Marketing &amp; Custom Software
              <br className="hidden md:block" /> Solutions That Drive Growth.
            </h2>
            <div className="mt-1 flex w-full max-w-xs flex-col items-center justify-center gap-3 sm:mt-2 sm:w-auto sm:max-w-none sm:flex-row sm:flex-wrap sm:gap-4">
              <a
                href="#contact"
                className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-rinads-primary px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-[#b45fd9] hover:shadow-[0_0_30px_rgba(159,75,199,0.45)] sm:w-auto sm:px-8 sm:text-sm"
              >
                Get a Free Consultation
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>
              <a
                href="#work"
                className="inline-flex w-full items-center justify-center gap-3 rounded-full border-2 border-rinads-primary px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-rinads-primary/15 sm:w-auto sm:px-8 sm:text-sm"
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
