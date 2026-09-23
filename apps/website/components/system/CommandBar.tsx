"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { HERO_COMMANDS } from "@/lib/product-ia";

type CommandBarProps = {
  commands?: readonly string[];
  placeholder?: string;
  className?: string;
};

export function CommandBar({
  commands = HERO_COMMANDS,
  placeholder = "Ask RINPO anything…",
  className = "",
}: CommandBarProps) {
  const { openPhoneScreen } = useRinpo();
  const [value, setValue] = useState("");

  const submit = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    openPhoneScreen("chat", trimmed);
    setValue("");
  };

  return (
    <div className={`w-full max-w-3xl ${className}`}>
      <form
        className="flex items-center gap-3 rounded-2xl border border-rinads-primary/30 bg-black/55 p-2.5 pl-4 backdrop-blur-md transition focus-within:border-rinads-primary/60 focus-within:ring-2 focus-within:ring-rinads-primary/20"
        onSubmit={(event) => {
          event.preventDefault();
          submit(value);
        }}
      >
        <div className="hidden shrink-0 items-center gap-2 pr-2 sm:flex" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-rinads-primary shadow-[0_0_16px_rgba(159,75,199,0.8)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">RINPO</span>
        </div>
        <label className="sr-only" htmlFor="rinpo-command">
          Talk to RINPO
        </label>
        <input
          id="rinpo-command"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none md:text-base"
        />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rinads-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Ask
          <ArrowRight size={14} aria-hidden />
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {commands.map((command) => (
          <button
            key={command}
            type="button"
            onClick={() => submit(command)}
            className="min-h-9 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 transition hover:border-rinads-primary/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary md:text-sm"
          >
            {command}
          </button>
        ))}
      </div>
    </div>
  );
}
