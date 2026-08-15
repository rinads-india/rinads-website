"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

const FOOTER_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_104800_bc43ae09-f494-43e3-97d7-2f8c1692cfd7.mp4";

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

const NAV_COL_1 = [
  { label: "Services", href: "#services" },
  { label: "Solutions", href: "#work" },
  { label: "RINADS Cloud", href: "/rinads-cloud" },
  { label: "About", href: "#about" },
];

const NAV_COL_2 = [
  { label: "Contact", href: "#contact" },
  { label: "Project", href: "/projects" },
  { label: "Story", href: "/story-concept" },
  { label: "Terms and Condition", href: "/contact" },
  { label: "Privacy Policy", href: "/contact" },
];

export function Footer() {
  const [videoFailed, setVideoFailed] = useState(false);
  const { openPhoneScreen } = useRinpo();
  const watermarkSvgRef = useRef<SVGSVGElement>(null);
  const watermarkTextRef = useRef<SVGTextElement>(null);

  const fitWatermark = useCallback(() => {
    const svg = watermarkSvgRef.current;
    const text = watermarkTextRef.current;
    if (!svg || !text) return;
    try {
      const bbox = text.getBBox();
      svg.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
    } catch {
      /* SVG not yet measurable */
    }
  }, []);

  useEffect(() => {
    if (document.fonts?.ready) {
      document.fonts.ready.then(fitWatermark);
    } else {
      window.addEventListener("load", fitWatermark);
    }
    window.addEventListener("resize", fitWatermark);
    return () => window.removeEventListener("resize", fitWatermark);
  }, [fitWatermark]);

  const handleMeetRinpo = () => {
    window.location.href = "/rinpo-story";
  };

  const handleSubscribe = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    openPhoneScreen("chat", email ? `Subscribe me for RINADS updates: ${email}` : undefined);
  };

  return (
    <section id="contact" className="footer-section" aria-label="Site footer">
      <div className="footer-wrapper">
        <div className="footer-left">
          {!videoFailed ? (
            <video
              className="footer-left-video"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onError={() => setVideoFailed(true)}
            >
              <source src={FOOTER_VIDEO} type="video/mp4" />
            </video>
          ) : null}

          <div className="footer-logo">
            <a href="#" aria-label="Rinads home">
              <Logo className="h-10 md:h-12 brightness-0 invert" priority={false} />
            </a>
          </div>

          <div className="footer-tagline-container">
            <p className="footer-tagline">
              Business simplified,
              <br />
              <span>powered by RINPO Intelligence.</span>
            </p>
          </div>

          <div className="footer-social-row">
            <span className="footer-social-label">Stay connected!</span>
            <div className="footer-social-icons">
              {SOCIALS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.name}
                  className="social-icon"
                >
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-right">
          <button
            type="button"
            className="footer-lucky-graphic"
            onClick={handleMeetRinpo}
            aria-label="Meet RINPO — open RINADS Intelligence chat"
          >
            <div className="lucky-cube">
              <Image
                src="/assets/rinpo-head.png"
                alt=""
                width={96}
                height={96}
                className="lucky-cube-image"
                aria-hidden
              />
            </div>
            <div className="lucky-text-row">
              <svg className="lucky-arrow" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M3 20 C 6 14, 10 9, 18 5" />
                <path d="M18 5 L 12 5" />
                <path d="M18 5 L 18 11" />
              </svg>
              <span className="lucky-text">Meet RINPO?</span>
            </div>
          </button>

          <div className="footer-right-top">
            <div className="footer-nav-cols">
              <div className="footer-col">
                <p className="footer-col-title">Navigation</p>
                {NAV_COL_1.map((link) => (
                  <a key={link.label} href={link.href}>
                    {link.label}
                  </a>
                ))}
              </div>
              <div className="footer-col">
                <p className="footer-col-title">Company</p>
                {NAV_COL_2.map((link) => (
                  <a key={link.label} href={link.href}>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              © {new Date().getFullYear()} RINADS®. All rights reserved.
            </p>

            <div className="footer-cta-mini">
              <h4>
                Business moves fast.
                <strong>Stay ahead with RINADS.</strong>
              </h4>
              <form className="footer-subscribe-row" onSubmit={handleSubscribe}>
                <label htmlFor="footer-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="footer-email"
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  autoComplete="email"
                />
                <button type="submit">Subscribe</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-watermark" aria-hidden="true">
        <svg
          ref={watermarkSvgRef}
          viewBox="62 95 876 175"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <text ref={watermarkTextRef} x="500" y="240" textAnchor="middle" fontSize="320">
            RINADS
          </text>
        </svg>
      </div>
    </section>
  );
}
