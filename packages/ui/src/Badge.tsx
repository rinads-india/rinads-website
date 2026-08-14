import type { HTMLAttributes } from "react";

type Tone = "default" | "success" | "warning" | "danger";

const toneClass: Record<Tone, string> = {
  default: "bg-surface-muted text-foreground",
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
};

export function Badge({
  tone = "default",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClass[tone]} ${className}`}
      {...props}
    />
  );
}
