"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type ThemeToggleProps = {
  className?: string;
  variant?: "default" | "island";
};

export function ThemeToggle({ className = "", variant = "default" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const variantClass =
    variant === "island"
      ? "border-black/10 bg-white text-[var(--island-foreground)] hover:border-rinads-primary/40 hover:text-rinads-primary"
      : "border-[var(--nav-border)] bg-[var(--nav-surface)] text-[var(--nav-foreground)] hover:border-rinads-primary/50 hover:text-rinads-primary";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary ${variantClass} ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
    >
      {isDark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </button>
  );
}
