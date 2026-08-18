"use client";

import type { ReactNode } from "react";
import { Navbar } from "@/components/rinads/Navbar";
import { Footer } from "@/components/rinads/Footer";

type ProductPageShellProps = {
  children: ReactNode;
  className?: string;
};

export function ProductPageShell({ children, className = "" }: ProductPageShellProps) {
  return (
    <main id="main" className={`bg-surface font-inter ${className}`}>
      <Navbar />
      {children}
      <Footer />
    </main>
  );
}
