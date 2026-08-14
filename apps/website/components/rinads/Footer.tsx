"use client";

import { Globe, Phone } from "lucide-react";
import { Logo } from "./Logo";

const LINKS = [
  { label: "Services", href: "#services" },
  { label: "Solutions", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function Footer() {
  return (
    <footer
      id="contact"
      className="relative z-40 flex h-screen flex-col bg-rinads-primary-darkest"
    >
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(159,75,199,0.45), transparent 60%), radial-gradient(ellipse 40% 30% at 20% 80%, rgba(122,53,160,0.35), transparent 50%)",
          }}
        />

        {/* Knockout text with purple energy fill */}
        <div className="relative w-full mix-blend-screen">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(120deg, #e9b8ff 0%, #9f4bc7 35%, #5c2480 70%, #c06be8 100%)",
            }}
          />
          <a
            href="tel:+918921195996"
            className="relative block bg-black mix-blend-multiply text-center text-[12vw] font-black leading-none tracking-tighter text-white transition-colors duration-500 hover:text-rinads-primary"
          >
            LET&apos;S TALK.
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 md:px-12 lg:px-20 py-8 border-t border-rinads-primary/20">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-sm md:text-base text-white/90">
          <a
            href="tel:+918921195996"
            className="inline-flex items-center gap-3 transition-colors hover:text-rinads-primary"
          >
            <Phone size={18} className="text-rinads-primary" />
            +91 89211 95996
          </a>
          <a
            href="https://www.rinads.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 transition-colors hover:text-rinads-primary"
          >
            <Globe size={18} className="text-rinads-primary" />
            www.rinads.com
          </a>
        </div>

        {/* pl on md+ keeps the row clear of the fixed RINPO launcher in the bottom-left */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:pl-32">
          <a href="#" aria-label="Rinads home" className="inline-flex rounded-lg">
            <Logo className="h-7 md:h-8" />
          </a>

          <nav className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition-colors hover:text-rinads-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <p className="text-xs uppercase tracking-widest text-slate-400">
            © {new Date().getFullYear()} RINADS®
          </p>
        </div>
      </div>
    </footer>
  );
}
