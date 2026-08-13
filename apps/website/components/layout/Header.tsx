"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/rinads-cloud", label: "Rinads Cloud" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const { setLoginModalOpen, setLoginModalMode } = useRinpo();
  const { user, logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const openLogin = (mode: "login" | "signup") => {
    setLoginModalMode(mode);
    setLoginModalOpen(true);
    setMenuOpen(false);
  };

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-30 border-b border-[var(--rinads-primary)]/20 bg-[var(--background)]/90 backdrop-blur-md safe-area-inset-top"
      style={{ paddingTop: "env(safe-area-inset-top, 0)" }}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16 min-h-[44px]">
        <Link href="/" className="flex items-center gap-2 group min-h-[44px] items-center flex">
          <span className="text-lg sm:text-xl font-bold text-[var(--rinads-primary)] group-hover:opacity-90 transition-opacity">
            Rinads
          </span>
          <span className="text-xs text-[var(--foreground)]/70 hidden sm:inline">Business simplified</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 lg:gap-4 overflow-x-auto scrollbar-hide">
          {NAV.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? "text-[var(--rinads-primary)]" : "text-[var(--foreground)]/80 hover:text-[var(--foreground)]"
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--rinads-primary)] rounded-full"
                    layoutId="nav-underline"
                    transition={{ type: "spring", damping: 22 }}
                  />
                )}
              </Link>
            );
          })}
          <div className="relative ml-2" ref={menuRef} data-rinpo-guide="account">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="px-3 py-2 text-sm font-medium text-[var(--foreground)]/80 hover:text-[var(--foreground)] rounded-lg hover:bg-white/5"
            >
              {isAuthenticated ? `${user?.username} ▾` : "Account ▾"}
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  className="absolute right-0 top-full mt-1 py-1 min-w-[140px] rounded-xl border border-[var(--rinads-primary)]/30 bg-[var(--background)] shadow-lg"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 text-xs text-[var(--foreground)]/70 border-b border-white/10 capitalize">
                        {user?.role.replace("-", " ")}
                      </div>
                      <button
                        type="button"
                        onClick={() => { logout(); setMenuOpen(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--rinads-primary)]/20"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openLogin("login")}
                        className="w-full px-4 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--rinads-primary)]/20"
                      >
                        Login
                      </button>
                      <button
                        type="button"
                        onClick={() => openLogin("signup")}
                        className="w-full px-4 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--rinads-primary)]/20"
                      >
                        Sign Up
                      </button>
                      <div className="px-4 py-2 pt-2 border-t border-white/10">
                        <p className="text-xs text-white/60">
                          Clients: sign in via <span className="text-[var(--rinads-primary)]">Portal</span> tab on RINPO phone.
                        </p>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden p-2 -mr-2 rounded-lg text-[var(--foreground)] hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      {/* Mobile nav overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="md:hidden fixed inset-0 top-14 sm:top-16 z-20 bg-[var(--background)]/80 backdrop-blur-lg safe-area-inset-bottom"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
          >
            <motion.nav
              className="flex flex-col max-h-[calc(100vh-4rem)] overflow-y-auto py-4 px-4"
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
            >
              {NAV.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`px-4 py-3 text-base font-medium rounded-xl min-h-[48px] flex items-center ${
                      isActive ? "text-[var(--rinads-primary)] bg-[var(--rinads-primary)]/10" : "text-[var(--foreground)]/90"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="flex flex-col mt-4 pt-4 border-t border-white/10">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2 text-xs text-[var(--foreground)]/70 capitalize">{user?.role?.replace("-", " ")}</div>
                    <button
                      type="button"
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="px-4 py-3 text-left text-base text-[var(--foreground)] min-h-[48px] flex items-center"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => openLogin("login")}
                      className="px-4 py-3 text-left text-base text-[var(--foreground)] min-h-[48px] flex items-center"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => openLogin("signup")}
                      className="px-4 py-3 text-left text-base text-[var(--foreground)] min-h-[48px] flex items-center"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
