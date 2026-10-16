"use client";

import type { ReactNode } from "react";
import { Navbar } from "@/components/rinads/Navbar";
import { Footer } from "@/components/rinads/Footer";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/system/Breadcrumbs";

type MarketingPageShellProps = {
  children: ReactNode;
  className?: string;
  breadcrumbs?: BreadcrumbItem[];
};

export function MarketingPageShell({
  children,
  className = "",
  breadcrumbs,
}: MarketingPageShellProps) {
  return (
    <main id="main" className={`bg-surface font-sans ${className}`}>
      <Navbar />
      {breadcrumbs && breadcrumbs.length >= 2 ? (
        <div className="px-6 pt-28 md:px-12 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>
      ) : null}
      {children}
      <Footer />
    </main>
  );
}
