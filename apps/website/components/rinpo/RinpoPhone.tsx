"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRinpo } from "./RinpoProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Zap,
  Bell,
  User,
  X,
  Wifi,
  Signal,
  Battery,
  LayoutGrid,
} from "lucide-react";
import {
  RinpoChat,
  ClientPortal,
  SearchServices,
  Support,
  PlansReminders,
  PhoneHomeScreen,
  QuickActionsScreen,
  NotificationsScreen,
  ProfileMemoryScreen,
  type PhoneScreenId,
} from "./RinpoPhoneScreens";
import { useRinpoMemory } from "@/hooks/useRinpoMemory";

const RINPO_HEAD = "/assets/rinpo-head.png";

const BOTTOM_BAR_ITEMS: { id: PhoneScreenId; label: string; icon: typeof MessageSquare; badge?: string }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "home", label: "Apps", icon: LayoutGrid },
  { id: "quick-actions", label: "Quick Actions", icon: Zap },
  { id: "notifications", label: "Notifications", icon: Bell, badge: "2" },
  { id: "profile", label: "Profile", icon: User },
];

export function RinpoPhone() {
  const { phoneOpen, setPhoneOpen, setLoginModalOpen, setLoginModalMode } = useRinpo();
  const [screen, setScreen] = useState<PhoneScreenId>("chat");
  const [currentTime, setCurrentTime] = useState("9:41");
  const [currentDateStr, setCurrentDateStr] = useState("TUESDAY, 21 JULY");
  const { getPersonalizedGreeting } = useRinpoMemory();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours % 12 || 12}:${minutes}`);

      const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      setCurrentDateStr(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!phoneOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="rinpo-phone-backdrop"
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setPhoneOpen(false)}
        aria-hidden
      />

      {/* Realistic Handset Body Container */}
      <motion.div
        key="rinpo-phone-panel"
        className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:left-6 md:left-12 z-50 flex items-center justify-center pointer-events-none"
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 24, stiffness: 220 }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto relative w-full h-full sm:h-[680px] sm:w-[360px] md:w-[380px] bg-[#0c0514] text-white flex flex-col sm:rounded-[44px] overflow-hidden border-0 sm:border-[5px] sm:border-[#2b1942] sm:ring-1 sm:ring-purple-500/30 sm:shadow-[0_0_60px_rgba(159,75,199,0.35),0_25px_50px_-12px_rgba(0,0,0,0.9)]"
        >
          {/* Subtle Outer Metal Bezel Highlight */}
          <div className="pointer-events-none absolute inset-0 sm:rounded-[39px] border border-white/10 z-30" />

          {/* Top Status Bar with Dynamic Island */}
          <div className="relative shrink-0 pt-3 px-6 flex items-center justify-between text-xs font-semibold text-white/90 z-20">
            <span>{currentTime}</span>

            {/* Dynamic Island Pill */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2.5 h-6 w-24 bg-black rounded-full flex items-center justify-center px-2 gap-1.5 shadow-inner">
              <span className="h-2 w-2 rounded-full bg-purple-500/80 animate-pulse" />
              <span className="text-[9px] font-mono tracking-widest text-purple-300">RINADS</span>
            </div>

            <div className="flex items-center gap-1.5 text-white/80">
              <Signal size={13} />
              <Wifi size={13} />
              <Battery size={15} />
            </div>
          </div>

          {/* Personalized RINPO Header (Avatar + Date + Greeting) */}
          <div className="shrink-0 px-4 pt-2.5 pb-2 flex items-center justify-between border-b border-purple-500/20 bg-gradient-to-b from-purple-950/30 to-transparent z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative h-10 w-10 shrink-0 rounded-full bg-gradient-to-tr from-purple-600 to-purple-400 p-0.5 shadow-md shadow-purple-900/50">
                <div className="h-full w-full rounded-full bg-[#12071f] overflow-hidden flex items-center justify-center">
                  <Image
                    src={RINPO_HEAD}
                    alt="RINPO avatar"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0c0514]" />
              </div>

              <div className="min-w-0">
                <div className="text-[10px] font-bold tracking-widest uppercase text-purple-300/80">
                  {currentDateStr}
                </div>
                <div className="text-xs font-semibold text-white/95 truncate">
                  {getPersonalizedGreeting()}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPhoneOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors ml-2"
              aria-label="Close handset"
            >
              <X size={16} />
            </button>
          </div>

          {/* Main Screen Body View */}
          <div className="flex-1 min-h-0 overflow-hidden relative bg-gradient-to-b from-[#0c0514] via-[#12071f] to-[#0a0312]">
            <AnimatePresence mode="wait">
              <motion.div
                key={screen}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="h-full"
              >
                {screen === "chat" && <RinpoChat />}
                {screen === "home" && (
                  <PhoneHomeScreen
                    onOpenApp={(appId) => {
                      if (appId === "support-app") setScreen("support");
                      else if (appId === "invoices") setScreen("portal");
                      else if (appId === "projects" || appId === "marketing") setScreen("services");
                    }}
                    onOpenChat={() => {
                      setScreen("chat");
                    }}
                  />
                )}
                {screen === "quick-actions" && (
                  <QuickActionsScreen
                    onOpenChat={() => {
                      setScreen("chat");
                    }}
                  />
                )}
                {screen === "notifications" && <NotificationsScreen />}
                {screen === "profile" && (
                  <ProfileMemoryScreen
                    onOpenLogin={() => {
                      setLoginModalMode("login");
                      setLoginModalOpen(true);
                    }}
                  />
                )}
                {screen === "portal" && <ClientPortal />}
                {screen === "services" && <SearchServices />}
                {screen === "support" && <Support />}
                {screen === "plans" && <PlansReminders />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom App Navigation Bar */}
          <nav className="shrink-0 border-t border-purple-500/20 bg-[#090310]/95 px-2 py-2 flex items-center justify-around z-20 safe-area-inset-bottom">
            {BOTTOM_BAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = screen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScreen(item.id)}
                  className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                    isActive
                      ? "text-purple-300 font-bold"
                      : "text-white/50 hover:text-white/80 font-medium"
                  }`}
                >
                  <div className="relative">
                    <Icon size={19} className={isActive ? "text-purple-300" : ""} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-purple-500 px-1 text-[8px] font-extrabold text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="phone-active-tab-glow"
                      className="absolute inset-0 rounded-xl bg-purple-600/15 border border-purple-500/30 -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Home Bar Indicator */}
          <div className="shrink-0 pb-1.5 flex justify-center bg-[#090310] z-20">
            <div className="h-1 w-28 bg-white/30 rounded-full" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
