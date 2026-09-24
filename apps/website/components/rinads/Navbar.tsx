"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogOut, Menu, UserRound, X } from "lucide-react";
import { DynamicIslandNav } from "./DynamicIslandNav";
import { Logo } from "./Logo";
import { NavDropdown } from "./NavDropdown";
import { ThemeToggle } from "./ThemeToggle";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { useAuth } from "@/contexts/AuthContext";
import { CTAS, NAV_GROUPS } from "@/lib/product-ia";

const islandLinkClass =
  "rounded-full px-2 py-2 text-[11px] font-semibold tracking-[0.08em] text-[var(--island-foreground)] transition-colors hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary xl:px-2.5 xl:text-xs";

function MobileMenuOverlay({
  open,
  onClose,
  isAuthenticated,
  onTalkToRinpo,
}: {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onTalkToRinpo: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const enter = prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 0 };
  const shown = { opacity: 1 };
  const sectionEnter = prefersReducedMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 18 };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          id="rinads-mobile-menu"
          initial={enter}
          animate={shown}
          exit={enter}
          transition={prefersReducedMotion ? { duration: 0 } : undefined}
          className="fixed inset-0 z-[45] overflow-y-auto bg-rinads-primary-darkest px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-24"
        >
          <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
            {NAV_GROUPS.map((group, groupIndex) => (
              <motion.section
                key={group.label}
                initial={sectionEnter}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { delay: groupIndex * 0.04, duration: 0.28, ease: [0.16, 1, 0.3, 1] }
                }
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  {group.href ? (
                    <Link
                      href={group.href}
                      onClick={onClose}
                      className="rounded-lg text-xl font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      {group.label}
                    </Link>
                  ) : (
                    <p className="text-xl font-bold text-white">{group.label}</p>
                  )}
                  {group.href ? (
                    <Link
                      href={group.href}
                      onClick={onClose}
                      className="rounded-lg text-xs font-semibold uppercase tracking-[0.14em] text-white/55 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      Overview →
                    </Link>
                  ) : null}
                </div>

                <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {group.items.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className="block min-h-11 rounded-xl px-3 py-2.5 text-sm font-medium text-white/78 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <span className="flex items-center gap-2">
                          <span>{link.label}</span>
                          {link.status ? (
                            <span className="rounded-full border border-white/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-white/55">
                              {link.status}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.section>
            ))}

            <motion.div
              className="mt-2 flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
              initial={sectionEnter}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { delay: NAV_GROUPS.length * 0.04, duration: 0.28 }
              }
            >
              {isAuthenticated ? (
                <Link
                  href="/os"
                  onClick={onClose}
                  className="flex min-h-12 items-center justify-center rounded-full bg-rinads-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Open RINADS
                </Link>
              ) : (
                <>
                  <Link
                    href={CTAS.primary.href}
                    onClick={onClose}
                    className="flex min-h-12 items-center justify-center rounded-full bg-rinads-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {CTAS.primary.label}
                  </Link>
                  <Link
                    href={CTAS.signIn.href}
                    onClick={onClose}
                    className="flex min-h-12 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {CTAS.signIn.label}
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  onTalkToRinpo();
                  onClose();
                }}
                className="flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {CTAS.rinpo.label}
              </button>

              <div className="flex justify-center">
                <ThemeToggle className="h-11 w-11" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function Navbar() {
  const {
    dismissGuide,
    navMenuOpen: open,
    setNavMenuOpen: setOpen,
    openPhoneScreen,
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
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const toggleMenu = () => {
    setOpen(!open);
    dismissGuide();
  };

  const closeMenu = () => setOpen(false);
  const talkToRinpo = () => openPhoneScreen("chat");

  return (
    <>
      <DynamicIslandNav expanded={open} ariaLabel="Primary">
        <Link
          href="/"
          className="relative flex shrink-0 items-center rounded-full pl-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          aria-label="RINADS home"
        >
          <span
            aria-hidden
            className="absolute -right-0.5 top-1/2 h-2 w-2 -translate-y-1/2 animate-pulse rounded-full bg-rinads-primary/80"
          />
          <Logo className="h-6 sm:h-7 md:h-8" priority />
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1">
          {NAV_GROUPS.map((group) => (
            <NavDropdown key={group.label} group={group} linkClassName={islandLinkClass} />
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          {isAuthenticated ? (
            <>
              <Link
                href="/os"
                className="hidden h-10 shrink-0 items-center justify-center rounded-full bg-rinads-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary md:flex sm:h-11"
              >
                Open RINADS
              </Link>
              <div className="flex items-center gap-1" data-rinpo-guide="account">
                <span className="hidden max-w-[8rem] truncate text-xs font-medium text-[var(--island-foreground)] xl:inline">
                  {user?.username}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="flex h-10 min-w-10 items-center justify-center rounded-full px-2 text-[var(--island-foreground)] transition-colors hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary sm:h-11 sm:min-w-11"
                  aria-label="Log out"
                >
                  <LogOut size={18} aria-hidden />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href={CTAS.signIn.href}
                data-rinpo-guide="account"
                className="hidden h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-[var(--island-foreground)] transition-colors hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary md:flex sm:h-11"
              >
                <UserRound size={16} aria-hidden />
                <span>{CTAS.signIn.label}</span>
              </Link>
              <Link
                href={CTAS.primary.href}
                className="hidden h-10 shrink-0 items-center justify-center rounded-full bg-rinads-primary px-4 text-xs font-semibold text-white shadow-md shadow-rinads-primary/20 transition-colors hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary sm:flex sm:h-11"
              >
                {CTAS.primary.label}
              </Link>
            </>
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
            {open ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
          </button>
        </div>
      </DynamicIslandNav>

      {mounted
        ? createPortal(
            <MobileMenuOverlay
              open={open}
              onClose={closeMenu}
              isAuthenticated={isAuthenticated}
              onTalkToRinpo={talkToRinpo}
            />,
            document.body
          )
        : null}
    </>
  );
}
