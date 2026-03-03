"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { RinpoGuideId } from "@/hooks/useRinpoGuide";

const GUIDE_CONFIG: Record<NonNullable<RinpoGuideId>, { label: string; position: string }> = {
  "scroll-down": { label: "Scroll down for next page", position: "bottom-24 left-1/2 -translate-x-1/2" },
  account: { label: "Login or Sign Up here", position: "top-16 right-28 sm:right-32" },
  "tap-rinpo": { label: "Tap RINPO for Intelligence & Client Portal", position: "bottom-24 left-20" },
};

type RinpoGuideHintProps = {
  guideId: RinpoGuideId;
};

export function RinpoGuideHint({ guideId }: RinpoGuideHintProps) {
  if (!guideId) return null;

  const config = GUIDE_CONFIG[guideId];
  if (!config) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={guideId}
        className={`fixed z-50 pointer-events-none flex flex-col items-center gap-1 ${config.position}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <div className="flex flex-col items-center gap-0.5">
          <div className="px-2.5 py-1 rounded-lg bg-[var(--rinads-primary)]/90 text-white text-xs font-medium border border-[var(--rinads-primary)]/50">
            {config.label}
          </div>
          {guideId === "scroll-down" && (
            <motion.span
              className="text-lg text-[var(--rinads-primary)]"
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              ↓
            </motion.span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
