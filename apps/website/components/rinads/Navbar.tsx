"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, UserRound, X } from "lucide-react";
import { DynamicIslandNav } from "./DynamicIslandNav";
import { Logo } from "./Logo";
import { NavDropdown } from "./NavDropdown";
import { ThemeToggle } from "./ThemeToggle";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { useAuth } from "@/contexts/AuthContext";
import { NAV_GROUPS } from "@/lib/product-ia";

const islandLinkClass =
  "rounded-full text-xs font-semibold uppercase tracking-[0.3em] text-[var(--island-foreground)] transition-colors hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary";

function MobileMenuOverlay({
  open,
  onClose,
  isAuthenticated,
}: {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="rinads-mobile-menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[45] flex flex-col items-center justify-center gap-8 overflow-y-auto bg-rinads-primary-darkest px-6 pb-28 pt-24"
        >
          <div className="flex w-full max-w-md flex-col gap-8">
            {NAV_GROUPS.map((group, groupIndex) => (
              <motion.div
                key={group.label}
                initial={{ y: "-100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ delay: groupIndex * 0.08, duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
              >
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.35em] text-white/50">
                  {group.label}
                </p>
                <ul className="flex flex-col items-center gap-3">
                  {group.items.map((link) => (
                    <li key={link.href + link.label}>
                      {link.href.startsWith("/") && !link.href.includes("#") ? (
                        <Link
                          href={link.href}
                          onClick={onClose}
                          className="block rounded-2xl px-4 py-1 text-2xl font-black text-white transition-transform duration-300 hover:scale-105 hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary md:text-3xl"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          onClick={onClose}
                          className="block rounded-2xl px-4 py-1 text-2xl font-black text-white transition-transform duration-300 hover:scale-105 hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary md:text-3xl"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
            {isAuthenticated && (
              <motion.div
                initial={{ y: "-100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ delay: NAV_GROUPS.length * 0.08, duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
                className="text-center"
              >
                <Link
                  href="/os"
                  onClick={onClose}
                  className="inline-block rounded-2xl px-4 py-1 text-2xl font-black text-rinads-primary md:text-3xl"
                >
                  Open Business OS
                </Link>
              </motion.div>
            )}
          </div>

          {!isAuthenticated && (
            <motion.div
              className="flex w-full max-w-xs flex-col gap-3"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: NAV_GROUPS.length * 0.08, duration: 0.4 }}
            >
              <Link
                href="/signup"
                onClick={onClose}
                className="flex h-12 items-center justify-center rounded-full bg-rinads-primary text-base font-semibold text-white transition-colors hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Get Started
              </Link>
              <Link
                href="/signup?mode=login"
                onClick={onClose}
                className="flex h-12 items-center justify-center rounded-full border border-white/25 text-base font-semibold text-white transition-colors hover:border-rinads-primary hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Log in
              </Link>
            </motion.div>
          )}

          <ThemeToggle className="mt-2 h-12 w-12" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Navbar() {
  const {
    dismissGuide,
    navMenuOpen: open,
    setNavMenuOpen: setOpen,
  } = useRinpo();
  const { user, logout, isAuthenticated } = useAuth();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

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

  const closeMenu = () => setOpen(false);

  return (
    <>
      <DynamicIslandNav expanded={open} ariaLabel="Site">
        <Link
          href="/"
          className="relative flex shrink-0 items-center rounded-full pl-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          aria-label="Rinads home"
        >
          <span
            aria-hidden
            className="absolute -right-0.5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-rinads-primary/80 animate-pulse"
          />
          <Logo className="h-6 sm:h-7 md:h-8" priority />
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-2 lg:flex xl:gap-4">
          {NAV_GROUPS.map((group) => (
            <NavDropdown key={group.label} group={group} linkClassName={islandLinkClass} />
          ))}
          {isAuthenticated && (
            <Link href="/os" className={`${islandLinkClass} text-rinads-primary`}>
              Business OS
            </Link>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {!isAuthenticated && (
            <Link
              href="/signup"
              className="hidden h-10 shrink-0 items-center justify-center rounded-full bg-rinads-primary px-4 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-md shadow-rinads-primary/20 transition-colors hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary sm:flex sm:h-11 sm:px-5"
            >
              Get Started
            </Link>
          )}
          {isAuthenticated ? (
            <div className="flex items-center gap-2" data-rinpo-guide="account">
              <span className="hidden max-w-[10rem] truncate text-sm font-medium text-[var(--island-foreground)] sm:inline">
                {user?.username}
              </span>
              <button
                type="button"
                onClick={logout}
                className="flex h-10 min-w-10 items-center justify-center gap-2 rounded-full border border-black/10 px-3 text-sm font-semibold text-[var(--island-foreground)] transition-colors hover:border-rinads-primary/40 hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary sm:h-11 sm:min-w-11"
              >
                <LogOut size={18} aria-hidden />
                <span className="hidden md:inline">Log out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/signup?mode=login"
              data-rinpo-guide="account"
              className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-rinads-primary px-3 text-sm font-semibold text-white shadow-md shadow-rinads-primary/20 transition-colors hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:h-11 sm:gap-2 sm:px-5"
            >
              <UserRound size={18} aria-hidden />
              <span className="hidden sm:inline">Log in</span>
            </Link>
          )}

          <ThemeToggle variant="island" />

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="rinads-mobile-menu"
            onClick={toggleMenu}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--island-foreground)] transition-colors hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary sm:h-11 sm:w-11 lg:hidden"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </DynamicIslandNav>

      {mounted
        ? createPortal(
            <MobileMenuOverlay
              open={open}
              onClose={closeMenu}
              isAuthenticated={isAuthenticated}
            />,
            document.body
          )
        : null}
    </>
  );
}
