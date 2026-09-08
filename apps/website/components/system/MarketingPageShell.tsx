"use client";

import type { ReactNode } from "react";
import { Navbar } from "@/components/rinads/Navbar";
import { Footer } from "@/components/rinads/Footer";

type MarketingPageShellProps = {
  children: ReactNode;
  className?: string;
};

export function MarketingPageShell({ children, className = "" }: MarketingPageShellProps) {
  return (
    <main id="main" className={`bg-surface font-sans ${className}`}>
      <Navbar />
      {children}
      <Footer />
    </main>
  );
}
