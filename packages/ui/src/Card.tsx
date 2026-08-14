import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-rinads-primary/15 bg-surface p-4 shadow-sm ${className}`}
      {...props}
    />
  );
}
