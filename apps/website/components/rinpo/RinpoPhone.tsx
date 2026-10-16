"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRinpo } from "./RinpoProvider";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wifi, Signal, Battery } from "lucide-react";
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
import { RinpoModePlaceholder } from "./RinpoPhoneScreens/RinpoModePlaceholder";
import { useRinpoMemory } from "@/hooks/useRinpoMemory";
import { RINPO_STATE_LABELS } from "@/lib/rinpo-experience";
import {
  getPhoneModesForAudience,
  normalizePhoneScreen,
  type RinpoPhoneAudience,
} from "@/lib/rinpo-phone-modes";
import { useAuth } from "@/contexts/AuthContext";

const RINPO_HEAD = "/assets/rinpo-full-body-transparent-v2.png";

function resolveAudience(user: ReturnType<typeof useAuth>["user"]): RinpoPhoneAudience {
  if (!user) return "public";
  return "authenticated";
}

export function RinpoPhone() {
  const {
    phoneOpen,
    closeRinpo,
    setLoginModalOpen,
    setLoginModalMode,
    phoneScreen: rawScreen,
    openPhoneScreen,
    pendingChatPrompt,
    interactionState,
    pageContext,
  } = useRinpo();
  const { user } = useAuth();
  const audience = resolveAudience(user);
  const bottomModes = useMemo(() => getPhoneModesForAudience(audience), [audience]);
  const screen = normalizePhoneScreen(rawScreen);
  const activeMode = bottomModes.find((m) => m.id === screen);

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

  const openAsk = (prompt?: string) => openPhoneScreen("ask", prompt);

  function renderScreen() {
    const showDemo = audience === "public" && activeMode?.demoPlaceholder;

    switch (screen) {
      case "ask":
      case "chat":
        return <RinpoChat initialPrompt={pendingChatPrompt} />;
      case "apps":
      case "home":
        return (
          <PhoneHomeScreen onOpenChat={(prompt) => openAsk(prompt)} />
        );
      case "actions":
      case "quick-actions":
        return <QuickActionsScreen onOpenChat={(prompt) => openAsk(prompt)} />;
      case "approvals":
      case "notifications":
        if (showDemo) {
          return (
            <RinpoModePlaceholder
              title="Approvals"
              description="Demo view — signed-in workspaces route sensitive actions through human approval."
              onOpenChat={openAsk}
            />
          );
        }
        return <NotificationsScreen />;
      case "today":
      case "profile":
        if (showDemo) {
          return (
            <RinpoModePlaceholder
              title="Today"
              description="Demo agenda — connect your organisation to see attention items, meetings, and RINPO briefings."
              onOpenChat={openAsk}
            />
          );
        }
        return (
          <ProfileMemoryScreen
            onOpenLogin={() => {
              setLoginModalMode("login");
              setLoginModalOpen(true);
            }}
          />
        );
      case "work":
        if (showDemo) {
          return (
            <RinpoModePlaceholder
              title="Work"
              description="Demo work queue — live work items appear when Business OS is activated for your tenant."
              onOpenChat={openAsk}
            />
          );
        }
        return <ClientPortal />;
      case "customers":
        if (showDemo) {
          return (
            <RinpoModePlaceholder
              title="Customers"
              description="Demo CRM slice — customer timelines require an authenticated organisation."
              onOpenChat={openAsk}
            />
          );
        }
        return <ClientPortal />;
      case "money":
        if (showDemo) {
          return (
            <RinpoModePlaceholder
              title="Money"
              description="Demo money view — invoices and payments connect after finance modules are configured."
              onOpenChat={openAsk}
            />
          );
        }
        return <PlansReminders />;
      case "growth":
        if (showDemo) {
          return (
            <RinpoModePlaceholder
              title="Growth"
              description="Demo growth systems — campaigns and attribution need Marketing OS context."
              onOpenChat={openAsk}
            />
          );
        }
        return <SearchServices />;
      case "portal":
        return <ClientPortal />;
      case "services":
        return <SearchServices />;
      case "support":
        return <Support />;
      case "plans":
        return <PlansReminders />;
      default:
        return <RinpoChat initialPrompt={pendingChatPrompt} />;
    }
  }

  if (!phoneOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="rinpo-phone-backdrop"
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeRinpo}
        aria-hidden
      />

      <motion.div
        key="rinpo-phone-panel"
        className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 md:right-12 z-50 flex items-center justify-center pointer-events-none"
        initial={{ scale: 0.9, opacity: 0, y: 40, rotate: -1.5 }}
        animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40, rotate: -1.5 }}
        transition={{ type: "spring", damping: 24, stiffness: 220 }}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-6 hidden sm:block sm:rounded-[54px]"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(159,75,199,0.55), transparent 30%, rgba(192,107,232,0.35) 55%, transparent 80%, rgba(159,75,199,0.55))",
            filter: "blur(28px)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-2 hidden sm:block sm:rounded-[48px]"
          style={{ background: "var(--rinads-glow)", filter: "blur(20px)" }}
          animate={{ opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto relative w-full h-full sm:h-[680px] sm:w-[360px] md:w-[380px] bg-[#0c0514] text-white flex flex-col sm:rounded-[44px] overflow-hidden border-0 sm:border-[5px] sm:border-[#2b1942] sm:ring-1 sm:ring-purple-500/30 sm:shadow-[0_0_60px_rgba(159,75,199,0.35),0_25px_50px_-12px_rgba(0,0,0,0.9)]"
        >
          <div className="pointer-events-none absolute inset-0 sm:rounded-[39px] border border-white/10 z-30" />

          <div className="relative shrink-0 pt-3 px-6 flex items-center justify-between text-xs font-semibold text-white/90 z-20">
            <span>{currentTime}</span>
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

          <div className="shrink-0 px-4 pt-2.5 pb-2 flex items-center justify-between border-b border-purple-500/20 bg-gradient-to-b from-purple-950/30 to-transparent z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <motion.div
                className="relative h-10 w-10 shrink-0 rounded-full bg-gradient-to-tr from-purple-600 to-purple-400 p-0.5 shadow-md shadow-purple-900/50"
                animate={{ rotate: [0, -6, 6, -3, 0] }}
                transition={{ duration: 5, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
              >
                <div className="relative h-full w-full rounded-full bg-[#12071f] overflow-hidden flex items-center justify-center">
                  <Image
                    src={RINPO_HEAD}
                    alt="RINPO avatar"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0c0514]" />
              </motion.div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-purple-300/80">
                  <span>{currentDateStr}</span>
                  <span aria-hidden>·</span>
                  <span>{RINPO_STATE_LABELS[interactionState]}</span>
                </div>
                <div className="truncate text-xs font-semibold text-white/95">
                  {getPersonalizedGreeting()} · {pageContext.area}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={closeRinpo}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors ml-2"
              aria-label="Close handset"
            >
              <X size={16} />
            </button>
          </div>

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
                {renderScreen()}
              </motion.div>
            </AnimatePresence>
          </div>

          <nav
            className="shrink-0 border-t border-purple-500/20 bg-[#090310]/95 px-1 py-2 flex items-center gap-0.5 overflow-x-auto z-20 safe-area-inset-bottom"
            aria-label="RINPO phone modes"
          >
            {bottomModes.map((item) => {
              const Icon = item.icon;
              const isActive = screen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openPhoneScreen(item.id)}
                  className={`relative flex min-w-[4.25rem] flex-col items-center justify-center py-1 px-2 rounded-xl transition-all shrink-0 ${
                    isActive
                      ? "text-purple-300 font-bold"
                      : "text-white/50 hover:text-white/80 font-medium"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-purple-300" : ""} />
                  <span className="text-[9px] mt-0.5 tracking-tight text-center leading-tight">{item.label}</span>
                  {isActive ? (
                    <motion.div
                      layoutId="phone-active-tab-glow"
                      className="absolute inset-0 rounded-xl bg-purple-600/15 border border-purple-500/30 -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0 pb-1.5 flex justify-center bg-[#090310] z-20">
            <div className="h-1 w-28 bg-white/30 rounded-full" />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
