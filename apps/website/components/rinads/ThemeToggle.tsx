"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--nav-border)] bg-[var(--nav-surface)] text-[var(--nav-foreground)] transition-colors hover:border-rinads-primary/50 hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
    >
      {isDark ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
    </button>
  );
}
