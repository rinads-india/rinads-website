"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  PhoneCall,
  Calendar,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRinpoMemory } from "@/hooks/useRinpoMemory";

export function QuickActionsScreen({
  onOpenChat,
}: {
  onOpenChat: (msg: string) => void;
}) {
  const { addNote, addInterest } = useRinpoMemory();

  const actions = [
    {
      title: "Request Free Consultation",
      desc: "Schedule a 1-on-1 strategy call with our architects",
      icon: PhoneCall,
      onClick: () => {
        addInterest("Consultation");
        onOpenChat("I would like to book a free consultation for my business.");
      },
    },
    {
      title: "Run Digital Growth Audit",
      desc: "Instant AI analysis of your website, SEO & marketing",
      icon: Sparkles,
      onClick: () => {
        addInterest("Digital Audit");
        onOpenChat("Can you help me run an AI digital growth audit on my company?");
      },
    },
    {
      title: "Explore ERP & Custom Software",
      desc: "Web & Mobile apps, custom workflows, automation",
      icon: Zap,
      onClick: () => {
        addInterest("Custom Software");
        onOpenChat("Tell me about custom ERP and software solutions build by RINADS.");
      },
    },
    {
      title: "Book Project Review Meeting",
      desc: "Set a calendar reminder and sync with team",
      icon: Calendar,
      onClick: () => {
        addNote("Interested in booking project review");
        onOpenChat("How do I schedule a project kickoff meeting with RINADS?");
      },
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4 scrollbar-hide text-white">
      <div>
        <h3 className="text-sm font-bold text-purple-300">Quick Actions</h3>
        <p className="text-xs text-white/60">One-tap workflows & instant AI actions</p>
      </div>

      <div className="space-y-2.5">
        {actions.map((act, i) => {
          const Icon = act.icon;
          return (
            <motion.button
              key={act.title}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={act.onClick}
              className="w-full flex items-start gap-3 p-3 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-[#220d36]/80 to-[#150724]/80 text-left hover:border-purple-400/50 hover:bg-purple-950/40 transition-all shadow-md"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600/30 text-purple-300">
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white">{act.title}</div>
                <div className="text-[11px] text-white/60 mt-0.5">{act.desc}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function NotificationsScreen() {
  const { memory } = useRinpoMemory();

  const notifications = [
    {
      id: "1",
      title: "Welcome to RINADS Cloud",
      desc: `Hi ${memory.username}, your personalized workspace is ready.`,
      time: "Just now",
      unread: true,
    },
    {
      id: "2",
      title: "New AI Capability: RINPO Vision",
      desc: "Multimodal image and screenshot support is now live in RINADS Intelligence.",
      time: "2h ago",
      unread: true,
    },
    {
      id: "3",
      title: "System Status: All Systems Operational",
      desc: "Cloud servers in Mumbai & Singapore operating at 99.99% uptime.",
      time: "1d ago",
      unread: false,
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4 scrollbar-hide text-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-purple-300">Notifications</h3>
          <p className="text-xs text-white/60">Live alerts & account updates</p>
        </div>
        <span className="rounded-full bg-purple-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-purple-200">
          2 New
        </span>
      </div>

      <div className="space-y-2.5">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-3 rounded-2xl border ${
              n.unread
                ? "border-purple-500/40 bg-purple-950/40"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{n.title}</span>
              <span className="text-[10px] text-purple-300">{n.time}</span>
            </div>
            <p className="text-[11px] text-white/70 mt-1">{n.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileMemoryScreen({
  onOpenLogin,
}: {
  onOpenLogin: () => void;
}) {
  const { logout, isAuthenticated } = useAuth();
  const { memory, addNote } = useRinpoMemory();
  const [newNote, setNewNote] = useState("");

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNote(newNote.trim());
    setNewNote("");
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4 scrollbar-hide text-white">
      {/* Profile Card */}
      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#2a1042] to-[#140624] p-4 text-center shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#9f4bc7] to-[#d97706] text-xl font-black text-white shadow-md">
          {memory.username.charAt(0).toUpperCase()}
        </div>
        <h3 className="mt-2 text-base font-bold text-white">{memory.username}</h3>
        <p className="text-xs text-purple-300 capitalize">{memory.role} • {memory.interactionCount} Interactions</p>

        <div className="mt-3 flex justify-center gap-2">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-white/20 px-3.5 py-1 text-xs font-semibold text-white/80 hover:border-red-400 hover:text-red-300 transition-colors"
            >
              Sign out
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="rounded-full bg-gradient-to-r from-[#9f4bc7] to-[#7a35a0] px-4 py-1 text-xs font-bold text-white shadow-md hover:opacity-90 transition-opacity"
            >
              Log in / Sign up
            </button>
          )}
        </div>
      </div>

      {/* Memory & Personalization Tags */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
          <Sparkles size={14} />
          <span>RINPO Personalized Memory</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2.5">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/50">Your Interests</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {memory.interests.map((it) => (
                <span key={it} className="rounded-lg bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] font-medium text-purple-200">
                  {it}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/50">Favorite Modules</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {memory.favoriteServices.map((fav) => (
                <span key={fav} className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                  ★ {fav}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/50">Custom Preferences & Notes</div>
            <ul className="mt-1 space-y-1">
              {memory.notes.map((note, i) => (
                <li key={i} className="text-[11px] text-white/80 flex items-start gap-1.5">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
            <form onSubmit={handleAddNote} className="mt-2 flex gap-1.5">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add private note..."
                className="flex-1 rounded-xl bg-black/40 border border-white/15 px-2.5 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
              />
              <button
                type="submit"
                className="rounded-xl bg-purple-600/80 px-2.5 py-1 text-xs font-semibold text-white hover:bg-purple-600"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
