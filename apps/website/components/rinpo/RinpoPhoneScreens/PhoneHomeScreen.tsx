"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { GRID_APPS, type GridAppId, AppDetailModal } from "./AppDetailModal";
import { useRinpoMemory } from "@/hooks/useRinpoMemory";

export function PhoneHomeScreen({
  onOpenApp,
  onOpenChat,
}: {
  onOpenApp: (appId: GridAppId) => void;
  onOpenChat: (initialMsg?: string) => void;
}) {
  const { getPersonalizedInsight } = useRinpoMemory();
  const [selectedApp, setSelectedApp] = useState<GridAppId | null>(null);

  const handleAppClick = (appId: GridAppId) => {
    setSelectedApp(appId);
    onOpenApp(appId);
  };

  return (
    <div className="relative flex flex-col h-full min-h-0 overflow-y-auto scrollbar-hide px-3.5 pt-2 pb-4">
      {/* Insight banner matching reference screenshot */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3.5 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-[#200b33]/90 to-[#30124d]/90 p-3 shadow-lg shadow-purple-950/50 backdrop-blur-md"
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/30 text-purple-300">
            <Sparkles size={12} />
          </div>
          <p className="text-[11px] leading-snug text-purple-100 font-medium">
            {getPersonalizedInsight()}
          </p>
        </div>
      </motion.div>

      {/* 4x4 Grid of App Icons */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        {GRID_APPS.map((app, index) => {
          const Icon = app.icon;
          return (
            <motion.button
              key={app.id}
              type="button"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02, duration: 0.2 }}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleAppClick(app.id)}
              className="group flex flex-col items-center justify-center gap-1.5 focus:outline-none"
            >
              <div className="relative flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#2a133d] to-[#170924] border border-purple-500/25 p-3 shadow-md shadow-purple-950/40 transition-all group-hover:border-purple-400 group-hover:shadow-purple-700/30">
                <Icon size={22} className="text-purple-200 transition-transform group-hover:scale-110" />
                {app.badge && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-500 px-1 text-[9px] font-bold text-white shadow-sm">
                    {app.badge}
                  </span>
                )}
              </div>
              <span className="text-[10.5px] font-medium text-white/80 group-hover:text-purple-200 truncate w-full text-center">
                {app.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* App Detail Modal */}
      <AnimatePresence>
        {selectedApp && (
          <AppDetailModal
            appId={selectedApp}
            onClose={() => setSelectedApp(null)}
            onOpenChat={onOpenChat}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
