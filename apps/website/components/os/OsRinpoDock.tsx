"use client";

import { useState } from "react";
import { Mic, MicOff, MessageCircle, Video, VideoOff } from "lucide-react";

type OsRinpoDockProps = {
  welcome?: boolean;
  welcomeMessage?: string;
};

export function OsRinpoDock({
  welcome = false,
  welcomeMessage = "Welcome to RINADS Business OS. Explore Dashboard to launch your workspace modules.",
}: OsRinpoDockProps) {
  const [expanded, setExpanded] = useState(welcome);
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState<string | null>(welcome ? welcomeMessage : null);
  const [sending, setSending] = useState(false);

  async function sendPrompt(event: React.FormEvent) {
    event.preventDefault();
    const message = prompt.trim();
    if (!message) return;

    setSending(true);
    setReply(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await response.json()) as { reply?: string };
      setReply(data.reply ?? "RINPO is ready to help with your workspace.");
      setPrompt("");
    } catch {
      setReply("RINPO intelligence is temporarily unavailable.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {expanded && (
        <div className="pointer-events-auto os-glass w-[min(92vw,360px)] rounded-3xl p-4 shadow-2xl">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rinads-primary text-xs font-bold text-white">
              R
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">RINPO Intelligence</p>
              <p className="text-xs text-gray-500">Locked to Business OS</p>
            </div>
          </div>

          {reply && (
            <p className="mb-3 rounded-2xl bg-gray-50 px-3 py-2 text-sm text-gray-700">{reply}</p>
          )}

          <form onSubmit={sendPrompt} className="flex gap-2">
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask RINPO about your workspace…"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              type="submit"
              disabled={sending}
              className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {sending ? "…" : "Send"}
            </button>
          </form>
        </div>
      )}

      <div className="pointer-events-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="flex h-11 items-center gap-2 rounded-2xl bg-black px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-gray-800"
        >
          <MessageCircle size={16} aria-hidden />
          RINPO
        </button>
        <button
          type="button"
          onClick={() => setCamOn((value) => !value)}
          aria-label={camOn ? "Turn camera off" : "Turn camera on"}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-gray-900 shadow-md transition hover:bg-white"
        >
          {camOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
        <button
          type="button"
          onClick={() => setMicOn((value) => !value)}
          aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-gray-900 shadow-md transition hover:bg-white"
        >
          {micOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
      </div>
    </div>
  );
}
