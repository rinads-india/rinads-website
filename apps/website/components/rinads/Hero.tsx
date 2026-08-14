"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Menu } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

const LANDING_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260717_120352_eb988725-1351-43b3-8095-16e4a1005e3d.mp4";

const SOCIALS: { name: string; href: string; path: string }[] = [
  {
    name: "X",
    href: "https://www.rinads.com",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.727-8.822L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    name: "LinkedIn",
    href: "https://www.rinads.com",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
  {
    name: "Facebook",
    href: "https://www.rinads.com",
    path: "M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97H15.83c-1.491 0-1.956.93-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z",
  },
];

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const { setLoginModalOpen, setLoginModalMode, dismissGuide, navMenuOpen, setNavMenuOpen } = useRinpo();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const wrapperScale = useTransform(scrollYProgress, [0.72, 1], [1, 0.86]);
  const wrapperY = useTransform(scrollYProgress, [0.72, 1], [0, 48]);
  const wrapperOpacity = useTransform(scrollYProgress, [0.78, 1], [1, 0]);

  const openAuth = (mode: "login" | "signup") => {
    setLoginModalMode(mode);
    setLoginModalOpen(true);
    dismissGuide();
  };

  return (
    <section ref={containerRef} className="relative z-10 h-[170vh]">
      <div className="sticky top-0 h-screen overflow-hidden bg-black p-3 md:p-4">
        <motion.div
          style={{ scale: wrapperScale, y: wrapperY, opacity: wrapperOpacity }}
          className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-black will-change-transform"
        >
          {!videoFailed ? (
            <video
              src={LANDING_VIDEO}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              onError={() => setVideoFailed(true)}
              className="anim-fade absolute inset-0 h-full w-full object-cover"
              style={{ animationDelay: "0.2s" }}
            />
          ) : (
            <div className="anim-fade rinads-aurora absolute inset-0" style={{ animationDelay: "0.2s" }} />
          )}

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/70"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[#9f4bc7]/15 mix-blend-overlay"
          />

          <nav className="relative z-10 flex items-center justify-between px-6 pt-6 md:px-10 md:pt-8">
            <div className="anim-stagger" style={{ animationDelay: "0.1s" }}>
              <a href="#" aria-label="Rinads home" className="inline-flex flex-col items-start">
                <Logo className="h-7 md:h-9" priority />
                <span className="mt-1 text-[10px] font-light tracking-[0.4em] text-white md:text-xs">
                  R O S
                </span>
              </a>
            </div>

            <div className="anim-stagger flex items-center gap-3" style={{ animationDelay: "0.2s" }}>
              <a
                href="#services"
                className="btn-cut-border hidden px-5 py-2.5 text-sm text-white hover:bg-white/10 md:block"
              >
                <span>Digital Marketing</span>
              </a>
              <a
                href="#work"
                className="btn-cut hidden bg-white px-5 py-2.5 text-sm text-black hover:bg-white/90 md:block"
              >
                Custom Software
              </a>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={logout}
                  data-rinpo-guide="account"
                  className="btn-cut bg-white px-4 py-2.5 text-sm text-black hover:bg-white/90 md:px-5"
                >
                  Log out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuth("login")}
                  data-rinpo-guide="account"
                  className="btn-cut bg-rinads-primary px-4 py-2.5 text-sm text-white hover:bg-[#b45fd9] md:px-5"
                >
                  Log in
                </button>
              )}
              <button
                type="button"
                aria-label={navMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={navMenuOpen}
                aria-controls="rinads-mobile-menu"
                onClick={() => {
                  setNavMenuOpen(!navMenuOpen);
                  dismissGuide();
                }}
                className="btn-cut-sm flex h-10 w-10 items-center justify-center bg-white text-black transition-colors hover:bg-white/90 lg:hidden"
              >
                <Menu size={18} />
              </button>
            </div>
          </nav>

          <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-between px-6 pb-6 md:px-10 md:pb-10">
            <div className="relative flex min-h-0 flex-1 items-center">
              <div
                className="anim-stagger absolute top-[18%] left-0 hidden flex-col gap-6 lg:flex"
                style={{ animationDelay: "0.4s" }}
              >
                <p className="max-w-[220px] text-base leading-relaxed text-white/80">
                  Come with us
                  <br />
                  simplifying
                  <br />
                  business
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-center gap-1">
                    <span className="h-4 w-4 rounded-full border border-white/40" />
                    <span className="h-4 w-4 rounded-full border border-white/40" />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-white/70">
                      RINPO
                      <br />
                      Intelligence
                    </span>
                    <span className="text-xs text-white/50">01</span>
                  </div>
                </div>
              </div>

              <div
                className="anim-stagger w-full text-center"
                style={{ animationDelay: "0.5s" }}
              >
                <h1
                  className="flex items-center justify-center gap-[3vw] text-white sm:gap-[2.5vw]"
                  style={{ textShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
                >
                  <span className="text-[20vw] leading-none font-black tracking-tighter sm:text-[16vw] md:text-[13vw] lg:text-[11vw]">
                    R
                  </span>
                  <span
                    data-rinpo-orb
                    aria-hidden
                    className="inline-block h-[14vw] w-[14vw] shrink-0 rounded-full bg-rinads-primary shadow-[0_0_60px_rgba(159,75,199,0.55)] sm:h-[12vw] sm:w-[12vw] md:h-[10vw] md:w-[10vw] lg:h-[9vw] lg:w-[9vw]"
                  />
                  <span className="text-[20vw] leading-none font-black tracking-tighter sm:text-[16vw] md:text-[13vw] lg:text-[11vw]">
                    S
                  </span>
                </h1>
                <span className="sr-only">ROS — RINADS, RINPO Intelligence. Business simplified.</span>
                <p
                  className="mt-3 text-base font-normal tracking-[-0.04em] text-white lg:hidden"
                  style={{ textShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
                >
                  Business simplified
                </p>
                <p
                  className="mt-4 hidden text-2xl leading-[1.15] font-normal tracking-[-0.04em] text-white lg:block xl:text-3xl"
                  style={{ textShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
                >
                  Business simplified
                  <br />
                  RINPO Intelligence
                  <br />
                  RINADS Creations
                </p>
              </div>
            </div>

            <div className="mt-4 grid shrink-0 grid-cols-1 items-center gap-4 md:mt-8 md:grid-cols-3 md:gap-6">
              <div
                className="anim-stagger hidden items-center justify-center md:flex md:justify-end"
                style={{ animationDelay: "0.7s" }}
              >
                <p className="max-w-[260px] text-center text-sm leading-relaxed text-white md:ml-auto md:text-left">
                  We push past conventions, reshaping the virtual terrain with next-level
                  technologies — marketing, software, and AI, unified under RINADS® Business Cloud.
                </p>
              </div>

              <div
                className="anim-stagger flex flex-col items-center gap-4 md:gap-8"
                style={{ animationDelay: "0.85s" }}
              >
                <span className="text-xl font-medium text-white md:text-3xl">RINADS Cloud</span>
                <a
                  href="#contact"
                  className="btn-cut group flex w-full max-w-[280px] items-center justify-center gap-2 bg-white py-3.5 text-black transition-colors hover:bg-white/90"
                >
                  <span className="text-sm font-medium">Discover Now</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>

              <div
                className="anim-stagger flex items-center justify-center gap-3 md:justify-end"
                style={{ animationDelay: "1s" }}
              >
                {SOCIALS.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.name}
                    className="btn-cut-sm flex h-10 w-10 items-center justify-center bg-white text-black transition-colors hover:bg-white/90"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                      <path d={social.path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
