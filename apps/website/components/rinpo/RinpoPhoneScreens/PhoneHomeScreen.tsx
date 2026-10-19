"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Building2,
  Globe2,
  LayoutGrid,
  MessageSquare,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { GRID_APPS, type GridAppId, AppDetailModal } from "./AppDetailModal";
import { useRinpoMemory } from "@/hooks/useRinpoMemory";
import { useAuth } from "@/contexts/AuthContext";
import { useRinpo } from "../RinpoProvider";
import type { PhoneScreenId } from ".";
import type { RinpoPhoneHomeApp, RinpoPhoneHomePayload } from "@/lib/rinpo-phone-home";

const LIVE_APP_ICONS = {
  today: Sun,
  rinpo: MessageSquare,
  work: Briefcase,
  customers: Users,
  money: Wallet,
  growth: TrendingUp,
  approvals: ShieldCheck,
  world: Globe2,
  apps: LayoutGrid,
  settings: Settings2,
} satisfies Record<RinpoPhoneHomeApp["id"], typeof Sun>;

function toPhoneScreen(appId: RinpoPhoneHomeApp["id"]): PhoneScreenId {
  return appId === "rinpo" ? "ask" : appId;
}

export function PhoneHomeScreen({
  onOpenChat,
}: {
  onOpenChat: (initialMsg?: string) => void;
}) {
  const { getPersonalizedInsight } = useRinpoMemory();
  const { isAuthenticated, authMode } = useAuth();
  const { openPhoneScreen } = useRinpo();
  const [selectedApp, setSelectedApp] = useState<GridAppId | null>(null);
  const [liveHome, setLiveHome] = useState<RinpoPhoneHomePayload | null>(null);
  const [liveState, setLiveState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);

  const loadLiveHome = useCallback(async () => {
    setLiveState("loading");
    try {
      const result = await fetch("/api/v1/phone/home", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!result.ok) throw new Error(`Phone home failed with ${result.status}`);
      const payload = (await result.json()) as RinpoPhoneHomePayload;
      setLiveHome(payload);
      setLiveState("ready");
    } catch {
      setLiveHome(null);
      setLiveState("error");
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && authMode === "supabase") {
      void loadLiveHome();
      return;
    }
    setLiveHome(null);
    setLiveState("idle");
  }, [authMode, isAuthenticated, loadLiveHome]);

  const handleAppClick = (appId: GridAppId) => {
    setSelectedApp(appId);
  };

  const selectWorkspace = async (workspaceId: string) => {
    if (!workspaceId || workspaceId === liveHome?.workspace.id) return;
    setSwitchingWorkspace(true);
    try {
      const result = await fetch("/api/v1/phone/workspaces/select", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      if (!result.ok) throw new Error(`Workspace switch failed with ${result.status}`);
      await loadLiveHome();
    } finally {
      setSwitchingWorkspace(false);
    }
  };

  if (isAuthenticated && authMode === "supabase") {
    return (
      <div className="relative flex h-full min-h-0 flex-col overflow-y-auto px-3.5 pb-4 pt-2 scrollbar-hide">
        {liveState === "loading" && !liveHome ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-purple-200/70">
              <RefreshCw size={15} className="animate-spin" />
              Loading your RINPO Phone workspace…
            </div>
          </div>
        ) : liveState === "error" ? (
          <div className="my-auto rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-center">
            <p className="text-xs font-semibold text-amber-100">Your live workspace could not be loaded.</p>
            <p className="mt-1 text-[10px] leading-4 text-white/45">No business data is shown when the authenticated home resolver is unavailable.</p>
            <button
              type="button"
              onClick={() => void loadLiveHome()}
              className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-[10px] font-bold text-white/80 hover:bg-white/15"
            >
              Retry
            </button>
          </div>
        ) : liveHome ? (
          <>
            <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-[#200b33]/90 to-[#30124d]/90 p-3 shadow-lg shadow-purple-950/50">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/30 text-purple-300">
                  <Sparkles size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple-300">RINPO Phone</p>
                  <p className="mt-0.5 text-xs font-semibold text-white">Hi {liveHome.user.displayName}.</p>
                  <p className="mt-1 text-[10px] leading-4 text-white/50">
                    Apps below are workspace visibility only. Every real action still uses server authorization and RLS.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center gap-2 text-purple-300">
                <Building2 size={14} />
                <span className="text-[10px] font-bold uppercase tracking-[0.12em]">Workspace</span>
              </div>
              <select
                value={liveHome.workspace.id}
                disabled={switchingWorkspace}
                onChange={(event) => void selectWorkspace(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#13091e] px-3 py-2 text-xs font-semibold text-white outline-none focus:border-purple-400 disabled:opacity-60"
                aria-label="Select RINPO Phone workspace"
              >
                {liveHome.workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name} · {workspace.roleKey}
                  </option>
                ))}
              </select>
            </div>

            <Link
              href="/os"
              className="mt-3 block rounded-2xl border border-purple-400/40 bg-purple-500/20 px-3 py-2.5 text-center text-[11px] font-semibold text-purple-100 transition hover:bg-purple-500/30"
            >
              Open Business OS
            </Link>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {liveHome.apps
                .filter((app) => app.id !== "apps")
                .map((app, index) => {
                  const Icon = LIVE_APP_ICONS[app.id];
                  return (
                    <motion.button
                      key={app.id}
                      type="button"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02, duration: 0.16 }}
                      onClick={() => openPhoneScreen(toPhoneScreen(app.id))}
                      className="group flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-3 transition hover:border-purple-400/50 hover:bg-purple-500/10"
                    >
                      <Icon size={19} className="text-purple-300" />
                      <span className="text-[10px] font-semibold text-white/80">{app.label}</span>
                      <span className="text-[8px] uppercase tracking-[0.08em] text-white/30">{app.placement}</span>
                    </motion.button>
                  );
                })}
            </div>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full min-h-0 overflow-y-auto scrollbar-hide px-3.5 pt-2 pb-4">
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

      {isAuthenticated && (
        <Link
          href="/os"
          className="mb-3 block rounded-2xl border border-purple-400/40 bg-purple-500/20 px-3 py-2.5 text-center text-[11px] font-semibold text-purple-100 transition hover:bg-purple-500/30"
        >
          Open Business OS
        </Link>
      )}

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
