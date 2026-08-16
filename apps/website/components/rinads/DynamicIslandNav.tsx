"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

type DynamicIslandNavProps = {
  children: ReactNode;
  expanded?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function DynamicIslandNav({
  children,
  expanded = false,
  className = "",
  ariaLabel = "Primary",
}: DynamicIslandNavProps) {
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 flex justify-center pt-[max(0.5rem,env(safe-area-inset-top))] ${
        expanded ? "z-[52]" : "z-50"
      }`}
    >
      <motion.nav
        layout
        aria-label={ariaLabel}
        animate={{
          scale: expanded ? 1.02 : 1,
          paddingBlock: expanded ? "0.875rem" : "0.625rem",
        }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className={`pointer-events-auto flex min-h-14 w-[calc(100%-12px)] max-w-6xl items-center gap-2 rounded-full border border-[var(--island-border)] bg-[var(--island-bg)] px-3 shadow-[var(--island-shadow)] sm:w-[calc(100%-24px)] sm:gap-4 sm:px-5 ${className}`}
      >
        {children}
      </motion.nav>
    </div>
  );
}
