"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/system/AppShell";
import type { BreadcrumbItem } from "@/components/system/Breadcrumbs";

type MarketingPageShellProps = {
  children: ReactNode;
  className?: string;
  breadcrumbs?: BreadcrumbItem[];
};

/** @deprecated Prefer AppShell — thin re-export for migration. */
export function MarketingPageShell({
  children,
  className = "",
  breadcrumbs,
}: MarketingPageShellProps) {
  return (
    <AppShell className={className} breadcrumbs={breadcrumbs}>
      {children}
    </AppShell>
  );
}
