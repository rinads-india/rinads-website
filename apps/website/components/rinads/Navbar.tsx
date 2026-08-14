"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, UserRound, X } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { useAuth } from "@/contexts/AuthContext";

const LINKS = [
  { label: "Services", href: "#services" },
  { label: "Solutions", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [overHero, setOverHero] = useState(pathname === "/");
  const {
    dismissGuide,
    navMenuOpen: open,
    setNavMenuOpen: setOpen,
  } = useRinpo();
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      if (pathname === "/") {
        setOverHero(window.scrollY < window.innerHeight * 0.55);
      } else {
        setOverHero(false);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const toggleMenu = () => {
    setOpen(!open);
    dismissGuide();
  };

  return (
    <>
      <nav
        className={`fixed top-4 md:top-6 left-1/2 z-50 flex w-[calc(100%-2rem)] md:w-[calc(100%-3rem)] max-w-7xl -translate-x-1/2 items-center gap-3 rounded-full border px-4 py-2.5 md:px-8 md:py-3.5 transition-all duration-500 ${
          overHero && !open
            ? "pointer-events-none -translate-y-3 opacity-0"
            : "translate-y-0 opacity-100"
        } ${
          scrolled || open
            ? "border-[var(--nav-border)] bg-[var(--nav-surface)] shadow-lg shadow-rinads-primary/10 backdrop-blur-xl"
            : "border-[var(--nav-border)] bg-[var(--nav-surface)] backdrop-blur-sm"
        }`}
      >
        <a
          href="#"
          className="mr-auto flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)]"
          aria-label="Rinads home"
        >
          <Logo className="h-6 sm:h-7 md:h-9" priority />
        </a>

        <div className="mr-2 hidden lg:flex items-center gap-8">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full text-xs font-semibold uppercase tracking-[0.3em] text-[var(--nav-foreground)] transition-colors hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
            >
              {link.label}
            </a>
          ))}
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-2" data-rinpo-guide={overHero ? undefined : "account"}>
            <span className="hidden sm:inline max-w-[10rem] truncate text-sm font-medium text-[var(--nav-foreground)]">
              {user?.username}
            </span>
            <button
              type="button"
              onClick={logout}
              className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-[var(--nav-border)] px-3 text-sm font-semibold text-[var(--nav-foreground)] transition-colors hover:border-rinads-primary/50 hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
            >
              <LogOut size={18} aria-hidden />
              <span className="hidden md:inline">Log out</span>
            </button>
          </div>
        ) : (
          <a
            href="/signup?mode=login"
            data-rinpo-guide={overHero ? undefined : "account"}
            className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-rinads-primary px-3 text-sm font-semibold text-white shadow-lg shadow-rinads-primary/25 transition-colors hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ring-offset)] sm:gap-2 sm:px-5"
          >
            <UserRound size={18} aria-hidden />
            Log in
          </a>
        )}

        <ThemeToggle />

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="rinads-mobile-menu"
          onClick={toggleMenu}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--nav-foreground)] transition-colors hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="rinads-mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-10 overflow-y-auto bg-rinads-primary-darkest px-6 py-28"
          >
            <ul className="flex flex-col items-center gap-5 md:gap-8">
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
                    className="block rounded-2xl px-4 py-1 text-4xl md:text-6xl font-black text-white transition-transform duration-300 hover:scale-110 hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
                  >
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </ul>

            {!isAuthenticated && (
              <motion.div
                className="flex w-full max-w-xs flex-col gap-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: LINKS.length * 0.08, duration: 0.4 }}
              >
                <a
                  href="/signup?mode=login"
                  onClick={() => setOpen(false)}
                  className="flex h-12 items-center justify-center rounded-full bg-rinads-primary text-base font-semibold text-white transition-colors hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Log in
                </a>
                <a
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="flex h-12 items-center justify-center rounded-full border border-white/25 text-base font-semibold text-white transition-colors hover:border-rinads-primary hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Sign up
                </a>
              </motion.div>
            )}

            <ThemeToggle className="mt-2 h-12 w-12" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
