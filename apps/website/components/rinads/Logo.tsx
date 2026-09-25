"use client";

import Image from "next/image";
import { useContext } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";

const LOGO_SRC = "/assets/rinads-logo.png";
const LOGO_W = 270;
const LOGO_H = 89;

export type LogoTone = "auto" | "color" | "onDark";

/**
 * Official RINADS lockup (exact artwork — do not redraw or replace with text wordmarks).
 * Size with height utilities; width tracks the artwork ratio.
 */
export function Logo({
  className = "h-7 md:h-8",
  priority = false,
  tone = "color",
}: {
  className?: string;
  priority?: boolean;
  /** color = brand PNG as-is; onDark = white lockup; auto = follows light/dark theme */
  tone?: LogoTone;
}) {
  const themeCtx = useContext(ThemeContext);
  const theme = themeCtx?.theme ?? "dark";
  const resolved: Exclude<LogoTone, "auto"> =
    tone === "auto" ? (theme === "dark" ? "onDark" : "color") : tone;
  const toneClass = resolved === "onDark" ? "brightness-0 invert" : "";

  return (
    <Image
      src={LOGO_SRC}
      alt="RINADS"
      width={LOGO_W}
      height={LOGO_H}
      priority={priority}
      className={`w-auto select-none ${toneClass} ${className}`.trim()}
    />
  );
}
