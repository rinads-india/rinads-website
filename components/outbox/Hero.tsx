"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";

const BG_VIDEO =
  "https://strvid.nyc3.cdn.digitaloceanspaces.com/cloudinary/bg1_jgni8n.mp4";
const CIRCLE_VIDEO =
  "https://strvid.nyc3.cdn.digitaloceanspaces.com/cloudinary/bg4_hzaahu.mp4";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Final 25%: shrink / round / fade the sticky wrapper
  const wrapperScale = useTransform(scrollYProgress, [0.75, 1], [1, 0.7]);
  const wrapperY = useTransform(scrollYProgress, [0.75, 1], [0, 80]);
  const wrapperRadius = useTransform(scrollYProgress, [0.75, 1], [0, 60]);
  const wrapperOpacity = useTransform(scrollYProgress, [0.75, 1], [1, 0]);

  // Circles scale consecutively
  const circle1Scale = useTransform(scrollYProgress, [0, 0.35], [0.5, 5]);
  const circle2Scale = useTransform(scrollYProgress, [0.08, 0.42], [0.5, 5]);
  const circle3Scale = useTransform(scrollYProgress, [0.16, 0.5], [0.5, 5]);
  const circle4Scale = useTransform(scrollYProgress, [0.24, 0.58], [0.5, 5]);
  const circlesOpacity = useTransform(scrollYProgress, [0.35, 0.55], [1, 0]);

  // BOX letters fade in first 5%
  const boxOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  // Content 1: 0.15 → 0.45
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

  // Content 2: from 0.45
  const content2Opacity = useTransform(scrollYProgress, [0.45, 0.55], [0, 1]);
  const content2Y = useTransform(scrollYProgress, [0.45, 0.55], [50, 0]);

  return (
    <section ref={containerRef} className="relative h-[400vh] z-10">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          style={{
            scale: wrapperScale,
            y: wrapperY,
            borderRadius: wrapperRadius,
            opacity: wrapperOpacity,
          }}
          className="relative h-full w-full overflow-hidden bg-brand-darker will-change-transform"
        >
          {/* Background video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
            src={BG_VIDEO}
          />

          {/* Concentric circles */}
          <motion.div
            style={{ opacity: circlesOpacity }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              style={{ scale: circle4Scale }}
              className="absolute h-[28vmin] w-[28vmin] rounded-full bg-[#521307] will-change-transform"
            />
            <motion.div
              style={{ scale: circle3Scale }}
              className="absolute h-[28vmin] w-[28vmin] rounded-full bg-[#8c2510] will-change-transform"
            />
            <motion.div
              style={{ scale: circle2Scale }}
              className="absolute h-[28vmin] w-[28vmin] rounded-full bg-[#c93a1c] will-change-transform"
            />
            <motion.div
              style={{ scale: circle1Scale }}
              className="absolute h-[28vmin] w-[28vmin] overflow-hidden rounded-full bg-brand-orange will-change-transform"
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50 mix-blend-overlay"
                src={CIRCLE_VIDEO}
              />
            </motion.div>
          </motion.div>

          {/* B [O] X giant typography — O formed by the orange circle */}
          <motion.div
            style={{ opacity: boxOpacity }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <span className="absolute right-[50%] mr-[14vmin] text-[30vmin] font-black leading-none tracking-tighter text-white">
              B
            </span>
            <span className="absolute left-[50%] ml-[11vmin] text-[30vmin] font-black leading-none tracking-tighter text-white">
              X
            </span>
          </motion.div>

          {/* Content 1 */}
          <motion.div
            style={{ opacity: content1Opacity, y: content1Y }}
            className="absolute inset-0 z-10 flex items-center justify-center px-6"
          >
            <h1 className="max-w-4xl text-center text-6xl md:text-8xl font-black leading-tight text-white">
              Think outside the box.
            </h1>
          </motion.div>

          {/* Content 2 */}
          <motion.div
            style={{ opacity: content2Opacity, y: content2Y }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 px-6"
          >
            <h2 className="max-w-5xl text-center text-4xl md:text-6xl font-black leading-tight text-white">
              Elevating Brands.
              <br />
              Defining Futures.
            </h2>
            <a
              href="#contact"
              className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-bold uppercase tracking-[0.3em] text-brand-darkest transition-colors hover:bg-brand-orange hover:text-white"
            >
              Let&apos;s Talk
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
