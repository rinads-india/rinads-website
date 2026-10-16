"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/system/AppShell";

type ProductPageShellProps = {
  children: ReactNode;
  className?: string;
};

/** @deprecated Prefer AppShell — thin re-export for migration. */
export function ProductPageShell({ children, className = "" }: ProductPageShellProps) {
  return <AppShell className={className}>{children}</AppShell>;
}
