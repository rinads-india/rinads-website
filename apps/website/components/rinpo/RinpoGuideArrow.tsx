"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RinpoGuideId } from "@/hooks/useRinpoGuide";

type GuideConfig = {
  label: string;
  /** When set, the hint tracks this element and hides if it isn't on screen. */
  anchor?: string;
  /** Used when the hint isn't anchored to an element. */
  position?: string;
  arrow?: "up" | "down";
};

const GUIDE_CONFIG: Record<NonNullable<RinpoGuideId>, GuideConfig> = {
  "scroll-down": {
    label: "Scroll down for next page",
    position: "bottom-24 left-1/2 -translate-x-1/2",
    arrow: "down",
  },
  account: { label: "Log in or sign up here", anchor: "[data-rinpo-guide='account']", arrow: "up" },
  "tap-rinpo": {
    label: "Tap RINPO for Intelligence & Client Portal",
    position: "bottom-28 left-4 sm:left-6",
  },
};

const GAP = 10;
const MARGIN = 8;

type AnchorRect = { top: number; left: number };

function useAnchorPosition(selector: string | undefined, active: boolean) {
  const [rect, setRect] = useState<AnchorRect | null>(null);

  const measure = useCallback(() => {
    if (!selector) return;
    const el = document.querySelector<HTMLElement>(selector);
    // offsetParent is null for `display: none`, i.e. the control is hidden at this breakpoint.
    if (!el || (el.offsetParent === null && getComputedStyle(el).position !== "fixed")) {
      setRect(null);
      return;
    }
    const box = el.getBoundingClientRect();
    if (box.width === 0 || box.height === 0 || box.bottom < 0 || box.top > window.innerHeight) {
      setRect(null);
      return;
    }
    setRect({ top: box.bottom + GAP, left: box.left + box.width / 2 });
  }, [selector]);

  useEffect(() => {
    if (!selector || !active) return;
    // Measure on the next frame so the navbar has settled before we anchor to it.
    const frame = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [selector, active, measure]);

  return rect;
}

type RinpoGuideHintProps = {
  guideId: RinpoGuideId;
  onDismiss?: () => void;
  onActivate?: () => void;
};

export function RinpoGuideHint({ guideId, onDismiss, onActivate }: RinpoGuideHintProps) {
  const config = guideId ? GUIDE_CONFIG[guideId] : undefined;
  const anchorRect = useAnchorPosition(config?.anchor, Boolean(config));

  // An anchored hint is only meaningful while its target is actually on screen.
  const visible = Boolean(config) && (!config?.anchor || anchorRect !== null);

  return (
    <AnimatePresence>
      {visible && config && (
        <motion.div
          key={guideId}
          className={`fixed z-30 flex flex-col items-center gap-1 ${
            anchorRect ? "-translate-x-1/2" : config.position ?? ""
          }`}
          style={
            anchorRect
              ? {
                  top: anchorRect.top,
                  left: Math.min(Math.max(anchorRect.left, MARGIN + 80), window.innerWidth - MARGIN - 80),
                }
              : undefined
          }
          initial={{ opacity: 0, y: config.arrow === "up" ? -6 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {config.arrow === "up" && (
            <motion.span
              className="text-base leading-none text-[var(--rinads-primary)]"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              aria-hidden
            >
              ▲
            </motion.span>
          )}
          <button
            type="button"
            onClick={() => {
              onActivate?.();
              onDismiss?.();
            }}
            className="max-w-[80vw] whitespace-nowrap rounded-full bg-[var(--rinads-primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-[var(--rinads-glow)] transition-colors hover:bg-[var(--rinads-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {config.label}
          </button>
          {config.arrow === "down" && (
            <motion.span
              className="text-lg text-[var(--rinads-primary)]"
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              aria-hidden
            >
              ↓
            </motion.span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
