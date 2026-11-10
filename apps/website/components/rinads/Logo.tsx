"use client";

import Image from "next/image";
import { useContext } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";

const LOGO_SRC = "/assets/rinads-logo.png";
const LOGO_W = 270;
const LOGO_H = 89;

// The exact approved PNG places the R emblem before the 31% horizontal point.
// On dark surfaces, the wordmark must be white while the ribbon R stays purple.
// Mask only the original wordmark's pixels: never invert or redraw the R emblem.
// Replace this temporary compositing approach with an approved dark master asset
// after Brand QA confirms a byte-verified source file.
const WORDMARK_START = "inset(0 0 0 31%)";

export type LogoTone = "auto" | "color" | "onDark";

/**
 * Official RINADS lockup; proportions and geometry come only from the
 * unchanged canonical PNG. Never replace with an HTML text wordmark.
 */
export function Logo({
  className = "h-7 md:h-8",
  priority = false,
  tone = "color",
}: {
  className?: string;
  priority?: boolean;
  tone?: LogoTone;
}) {
  const themeCtx = useContext(ThemeContext);
  const theme = themeCtx?.theme ?? "dark";
  const resolved: Exclude<LogoTone, "auto"> =
    tone === "auto" ? (theme === "dark" ? "onDark" : "color") : tone;

  const original = (
    <Image
      src={LOGO_SRC}
      alt="RINADS"
      width={LOGO_W}
      height={LOGO_H}
      priority={priority}
      className={`block w-auto select-none ${className}`.trim()}
    />
  );

  if (resolved === "color") return original;

  return (
    <span className="relative inline-block shrink-0 align-middle">
      {original}
      <Image
        src={LOGO_SRC}
        alt=""
        aria-hidden="true"
        width={LOGO_W}
        height={LOGO_H}
        priority={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain brightness-0 invert"
        style={{ clipPath: WORDMARK_START }}
      />
    </span>
  );
}
