"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { HERO_COMMANDS } from "@/lib/product-ia";
import { RINPOOrb } from "./RINPOOrb";

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
        className="flex items-center gap-3 rounded-2xl border border-rinads-primary/30 bg-black/55 px-4 py-3 backdrop-blur-md"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
      >
        <RINPOOrb size="sm" />
        <label className="sr-only" htmlFor="rinpo-command">
          Talk to RINPO
        </label>
        <input
          id="rinpo-command"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/45 focus:outline-none md:text-base"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-rinads-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
        >
          Ask
          <ArrowRight size={14} aria-hidden />
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {commands.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => submit(cmd)}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:border-rinads-primary/50 hover:text-white md:text-sm"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}
