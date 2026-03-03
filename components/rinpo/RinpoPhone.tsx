"use client";

import { useState } from "react";
import { useRinpo } from "./RinpoProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
  RinpoChat,
  ClientPortal,
  SearchServices,
  Support,
  PlansReminders,
  type PhoneScreenId,
} from "./RinpoPhoneScreens";

const TABS: { id: PhoneScreenId; label: string; icon: string }[] = [
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "portal", label: "Portal", icon: "📱" },
  { id: "services", label: "Services", icon: "🔍" },
  { id: "support", label: "Support", icon: "🛟" },
  { id: "plans", label: "Plans", icon: "📋" },
];

function ScreenContent({ screen }: { screen: PhoneScreenId }) {
  switch (screen) {
    case "chat":
      return <RinpoChat />;
    case "portal":
      return <ClientPortal />;
    case "services":
      return <SearchServices />;
    case "support":
      return <Support />;
    case "plans":
      return <PlansReminders />;
    default:
      return <RinpoChat />;
  }
}

export function RinpoPhone() {
  const { setPhoneOpen } = useRinpo();
  const [screen, setScreen] = useState<PhoneScreenId>("chat");

  return (
    <AnimatePresence>
      {/* Backdrop - tap to close on desktop/tablet; on mobile phone is fullscreen so backdrop is behind */}
      <motion.div
        key="rinpo-phone-backdrop"
        className="fixed inset-0 z-40 bg-black/60 sm:bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setPhoneOpen(false)}
        aria-hidden
      />
      {/* Phone: full-screen on mobile, centered on tablet, side panel on desktop */}
      <motion.div
        key="rinpo-phone-panel"
        className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:left-4 md:left-24 sm:right-4 md:right-auto z-50 w-full sm:w-[min(calc(100vw-2rem),400px)] md:max-w-sm sm:rounded-[2rem] overflow-hidden border-0 sm:border-2 border-[var(--rinads-primary)] bg-[var(--rinads-black)] shadow-[0_0_40px_var(--rinads-glow)] safe-area-inset-top safe-area-inset-bottom"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 22 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full sm:h-auto sm:aspect-[9/19] sm:max-h-[min(85vh,640px)] md:max-h-[min(80vh,640px)] flex flex-col">
          {/* Status bar / header */}
          <header className="flex items-center justify-between gap-2 px-4 py-2 border-b border-[var(--rinads-primary)]/30 shrink-0 min-h-[44px]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-8 h-8 shrink-0 rounded-lg bg-[var(--rinads-primary)]/20 flex items-center justify-center text-sm font-bold text-[var(--rinads-primary)]">
                R
              </span>
              <span className="text-sm font-semibold text-[var(--rinads-white)] truncate">RINADS Intelligence</span>
            </div>
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-white/10 text-[var(--rinads-white)] transition-colors"
              onClick={() => setPhoneOpen(false)}
              aria-label="Close phone"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>
          {/* Tab nav */}
          <nav className="flex border-b border-white/10 shrink-0 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setScreen(tab.id)}
                className={`shrink-0 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 min-w-[4rem] ${
                  screen === tab.id
                    ? "border-[var(--rinads-primary)] text-[var(--rinads-primary)]"
                    : "border-transparent text-white/60 hover:text-white/80"
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
          {/* Screen content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={screen}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                <ScreenContent screen={screen} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
