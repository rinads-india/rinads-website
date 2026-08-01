"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const LINKS = [
  { label: "Services", href: "#services" },
  { label: "Solutions", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <nav
        className={`fixed top-4 md:top-6 left-1/2 z-50 flex w-[calc(100%-2rem)] md:w-[calc(100%-3rem)] max-w-7xl -translate-x-1/2 items-center rounded-full border px-5 py-3 md:px-8 md:py-4 transition-all duration-500 ${
          scrolled
            ? "border-rinads-primary/30 bg-black/50 shadow-lg shadow-rinads-primary/10 backdrop-blur-xl"
            : "border-transparent bg-transparent shadow-lg"
        }`}
      >
        <a href="#" className="mr-auto" aria-label="Rinads home">
          <Logo />
        </a>

        <div className="mr-8 hidden lg:flex items-center gap-8">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition-colors hover:text-rinads-primary"
            >
              {link.label}
            </a>
          ))}
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="text-white transition-colors hover:text-rinads-primary"
        >
          {open ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-rinads-primary-darkest"
          >
            <ul className="flex flex-col items-center gap-6 md:gap-8">
              {LINKS.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ y: "-100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
                >
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block text-4xl md:text-6xl font-black text-white transition-transform duration-300 hover:scale-110 hover:text-rinads-primary"
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
