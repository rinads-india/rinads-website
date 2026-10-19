"use client";

import {
  ExternalLink,
  Globe2,
  Languages,
  LogOut,
  ShieldCheck,
  Smartphone,
  Volume2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRinpoMemory } from "@/hooks/useRinpoMemory";

export function PhoneWorldScreen() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="h-full overflow-y-auto px-4 py-4 scrollbar-hide">
      <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-[#2a103f] via-[#160920] to-[#0c0514] p-4 shadow-xl shadow-purple-950/40">
        <div className="flex items-center gap-2 text-purple-300">
          <Globe2 size={18} />
          <span className="text-[10px] font-bold uppercase tracking-[0.16em]">RINADS WORLD</span>
        </div>
        <h2 className="mt-3 text-xl font-black text-white">Your spatial extension of RINADS.</h2>
        <p className="mt-2 text-xs leading-5 text-white/65">
          WORLD is being developed as a separate interactive surface. The handset keeps the identity and trust boundary explicit: WORLD does not directly read private tenant business data.
        </p>

        <a
          href="https://world.rinads.com"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-500 px-4 py-3 text-xs font-bold text-white transition hover:bg-purple-400"
        >
          Open RINADS WORLD
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="mt-4 space-y-2.5">
        {[
          ["RINPO identity", isAuthenticated ? "Signed-in handset context available" : "Sign in to establish user context"],
          ["Business data", "Isolated by default — governed connectors only"],
          ["Commerce", "Uses platform commerce paths rather than game-side writes"],
          ["Multiplayer continuity", "Pilot / roadmap — no live cross-device sync claim"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-purple-300" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">{label}</p>
                <p className="mt-1 text-xs leading-5 text-white/80">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PhoneSettingsScreen() {
  const { user, authMode, logout } = useAuth();
  const { memory, updatePreferences } = useRinpoMemory();

  return (
    <div className="h-full overflow-y-auto px-4 py-4 scrollbar-hide">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-purple-300">RINPO PHONE</p>
        <h2 className="mt-1 text-xl font-black text-white">Settings & privacy</h2>
        <p className="mt-2 text-xs leading-5 text-white/55">
          These controls apply to the current handset experience. Persistent cross-device memory and device revocation remain behind the M1 backend/security work.
        </p>
      </div>

      <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
        <div className="flex items-center gap-2 text-purple-300">
          <Smartphone size={15} />
          <h3 className="text-xs font-bold">Session</h3>
        </div>
        <dl className="mt-3 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-white/45">Mode</dt>
            <dd className="text-right text-white/80">{authMode === "supabase" ? "Supabase" : "Demo / local"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-white/45">User</dt>
            <dd className="max-w-[190px] truncate text-right text-white/80">{user?.displayName || user?.username || "Guest"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-white/45">Memory scope</dt>
            <dd className="text-right text-white/80">Current browser</dd>
          </div>
        </dl>
      </section>

      <section className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
        <div className="flex items-center gap-2 text-purple-300">
          <Languages size={15} />
          <h3 className="text-xs font-bold">Language</h3>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["en", "ml"] as const).map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => updatePreferences({ language })}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                memory.preferences.language === language
                  ? "border-purple-400 bg-purple-500/20 text-purple-100"
                  : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10"
              }`}
            >
              {language === "en" ? "English" : "Malayalam"}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-purple-300">
            <Volume2 size={15} />
            <div>
              <h3 className="text-xs font-bold">Voice preference</h3>
              <p className="mt-0.5 text-[10px] text-white/40">Local handset preference only</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updatePreferences({ voiceEnabled: !memory.preferences.voiceEnabled })}
            aria-pressed={memory.preferences.voiceEnabled}
            className={`rounded-full px-3 py-1.5 text-[10px] font-bold transition ${
              memory.preferences.voiceEnabled
                ? "bg-purple-500 text-white"
                : "bg-white/10 text-white/50"
            }`}
          >
            {memory.preferences.voiceEnabled ? "ON" : "OFF"}
          </button>
        </div>
      </section>

      {user ? (
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-200 transition hover:bg-red-500/15"
        >
          <LogOut size={14} />
          Sign out of RINPO Phone
        </button>
      ) : null}
    </div>
  );
}
