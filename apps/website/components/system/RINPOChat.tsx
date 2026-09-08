"use client";

import { useState } from "react";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import { RINPOOrb } from "./RINPOOrb";

type Message = { role: "user" | "assistant"; text: string };

type RINPOChatProps = {
  initialPrompt?: string;
  className?: string;
};

export function RINPOChat({ initialPrompt, className = "" }: RINPOChatProps) {
  const { openPhoneScreen } = useRinpo();
  const [input, setInput] = useState(initialPrompt ?? "");
  const [messages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi — I'm RINPO. Ask me to run, build, grow, automate, or train.",
    },
  ]);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-rinads-primary/25 bg-black/60 ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <RINPOOrb size="sm" />
        <div>
          <p className="text-sm font-semibold text-white">RINPO</p>
          <p className="text-xs text-white/50">AI business interface</p>
        </div>
      </div>
      <div className="flex max-h-64 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              m.role === "assistant"
                ? "bg-rinads-primary/20 text-white"
                : "ml-auto bg-white/10 text-white"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <form
        className="flex gap-2 border-t border-white/10 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          openPhoneScreen("chat", input.trim());
          setInput("");
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message RINPO…"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-rinads-primary"
        />
        <button
          type="submit"
          className="rounded-xl bg-rinads-primary px-4 py-2 text-sm font-semibold text-white hover:bg-rinads-primary-dark"
        >
          Send
        </button>
      </form>
    </div>
  );
}
