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
  const { addNote, addInterest, startWorkflow } = useRinpoMemory();

  const actions = [
    {
      title: "Discuss a Consultation",
      desc: "Open RINPO and structure the business problem before a human follow-up.",
      icon: PhoneCall,
      onClick: () => {
        addInterest("Consultation");
        startWorkflow("Consultation discovery");
        onOpenChat("Help me structure what I should discuss in a RINADS consultation.");
      },
    },
    {
      title: "Plan a Growth Audit",
      desc: "Structure a review of website, SEO, campaigns, lead flow, and follow-up.",
      icon: Sparkles,
      onClick: () => {
        addInterest("Digital Audit");
        startWorkflow("Digital growth audit planning");
        onOpenChat("Help me plan a digital growth audit for my company.");
      },
    },
    {
      title: "Plan Software / ERP",
      desc: "Clarify requirements for web, mobile, business systems, and automation.",
      icon: Zap,
      onClick: () => {
        addInterest("Custom Software");
        startWorkflow("Custom software discovery");
        onOpenChat("Help me define requirements for a custom ERP or software system.");
      },
    },
    {
      title: "Plan a Project Review",
      desc: "Prepare the agenda, risks, questions, and next decisions for a review.",
      icon: Calendar,
      onClick: () => {
        addNote("Interested in project review planning");
        startWorkflow("Project review planning");
        onOpenChat("Help me prepare a project review meeting with RINADS.");
      },
    },
  ];

  return (
    <div className="flex h-full flex-col space-y-4 overflow-y-auto p-4 text-white scrollbar-hide">
      <div>
        <h3 className="text-sm font-bold text-purple-300">Conversation Starters</h3>
        <p className="text-xs leading-5 text-white/60">
          These open RINPO guidance. They do not book meetings, run external audits, or execute outside actions by themselves.
        </p>
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
              className="flex w-full items-start gap-3 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-[#220d36]/80 to-[#150724]/80 p-3 text-left shadow-md transition-all hover:border-purple-400/50 hover:bg-purple-950/40"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600/30 text-purple-300">
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white">{act.title}</div>
                <div className="mt-0.5 text-[11px] leading-4 text-white/60">{act.desc}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function NotificationsScreen() {
  const previews = [
    {
      id: "1",
      title: "Page context",
      desc: "RINPO can adapt public guidance to the RINADS area currently being viewed.",
      state: "Preview",
    },
    {
      id: "2",
      title: "Recommendation state",
      desc: "Recommendations are visually distinct from execution and do not imply mutation authority.",
      state: "Preview",
    },
    {
      id: "3",
      title: "Product actions",
      desc: "Real actions only become available where the connected product implements the required tool, permission, confirmation, or runtime path.",
      state: "Boundary",
    },
  ];

  return (
    <div className="flex h-full flex-col space-y-4 overflow-y-auto p-4 text-white scrollbar-hide">
      <div>
        <h3 className="text-sm font-bold text-purple-300">Activity Preview</h3>
        <p className="text-xs leading-5 text-white/60">
          Example interface states — not a live notification feed.
        </p>
      </div>

      <div className="space-y-2.5">
        {previews.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-white">{item.title}</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-purple-300">
                {item.state}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-5 text-white/70">{item.desc}</p>
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
