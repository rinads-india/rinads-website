"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRinpoMemory } from "@/hooks/useRinpoMemory";

export function PlansReminders() {
  const { memory, addReminder, removeReminder, startWorkflow } = useRinpoMemory();
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const reminders = memory.reminders;

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    addReminder(trimmed, dueDate || new Date().toISOString().slice(0, 10));
    startWorkflow("Reminder follow-up");
    setText("");
    setDueDate("");
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const isOverdue = (d: string) => new Date(d) < new Date() && d !== "";

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h3 className="text-sm font-semibold text-[var(--rinads-primary)]">Plans & Reminders</h3>
        <p className="text-xs text-white/80">
          Create plans and reminders. RINPO will help you execute and stay on track.
        </p>

        <form onSubmit={handleAddReminder} className="space-y-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What do you need to remember?"
            className="w-full rounded-xl bg-white/5 border border-[var(--rinads-primary)]/50 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--rinads-primary)]"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex-1 rounded-xl bg-white/5 border border-[var(--rinads-primary)]/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--rinads-primary)]"
            />
            <button
              type="submit"
              className="rounded-xl bg-[var(--rinads-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--rinads-primary)]"
            >
              Add
            </button>
          </div>
        </form>

        <div className="space-y-2">
          <p className="text-xs text-white/60">Your reminders</p>
          <AnimatePresence mode="popLayout">
            {reminders.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-white/40 py-4 text-center"
              >
                No reminders yet. Add one above or ask RINPO in Chat.
              </motion.p>
            ) : (
              reminders.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white/5 border border-[var(--rinads-primary)]/30 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{r.text}</p>
                    <p
                      className={`text-[10px] mt-0.5 ${
                        isOverdue(r.dueDate) ? "text-red-400" : "text-white/50"
                      }`}
                    >
                      {formatDate(r.dueDate)}
                      {isOverdue(r.dueDate) && " • Overdue"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeReminder(r.id)}
                    className="shrink-0 text-white/50 hover:text-red-400 text-xs px-2 py-1 rounded transition-colors"
                    aria-label="Remove reminder"
                  >
                    Remove
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
