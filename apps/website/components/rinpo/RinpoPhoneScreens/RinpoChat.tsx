"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSpeechRecognition, type SpeechLang } from "@/hooks/useSpeechRecognition";
import { useSpeak } from "@/hooks/useSpeak";
import { useRinpo } from "../RinpoProvider";
import { useRinpoMemory } from "@/hooks/useRinpoMemory";

type ChatLink = { label: string; href: string };
type ChatMessage = { role: "user" | "rinpo"; text: string; links?: ChatLink[] };

function MicIcon({ isListening }: { isListening: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={isListening ? "text-red-400 animate-pulse" : ""}
    >
      <path d="M12 2a3 3 0 0 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
      <path d="M12 19v3" />
      <path d="M9 22h6" />
    </svg>
  );
}

function SpeakerIcon({ enabled }: { enabled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={enabled ? "text-[var(--rinads-primary)]" : "text-white/40"}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

export function RinpoChat({ initialPrompt }: { initialPrompt?: string | null }) {
  const router = useRouter();
  const {
    setPhoneOpen,
    setRinpoState,
    openPhoneScreen,
    clearPendingChatPrompt,
  } = useRinpo();
  const {
    memory,
    addMessage,
    addInterest,
    updatePreferences,
    getPersonalizedGreeting,
  } = useRinpoMemory();
  const [input, setInput] = useState("");
  const voiceOutput = memory.preferences.voiceEnabled;
  const [lang, setLang] = useState<SpeechLang>(memory.preferences.language);

  const WELCOME_EN =
    "Hi! I'm RINPO, your RINADS assistant. Ask me anything—services, support, or open the client portal. Business simplified.";
  const WELCOME_ML =
    "നമസ്കാരം! ഞാൻ RINPO, നിങ്ങളുടെ RINADS അസിസ്റ്റന്റ്. സേവനങ്ങൾ, സമ്പർക്ക വിവരങ്ങൾ, ക്ലയന്റ് പോർട്ടൽ എന്നിവയെക്കുറിച്ച് ചോദിക്കുക. ബിസിനസ്സ് ലളിതമാക്കൽ.";
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    memory.messages.length
      ? memory.messages.map(({ role, text }) => ({ role, text }))
      : [{ role: "rinpo", text: memory.preferences.language === "ml" ? WELCOME_ML : `${getPersonalizedGreeting()} ${WELCOME_EN}` }]
  );
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const submitMessageRef = useRef<(text: string) => Promise<void>>(async () => {});
  const { speak, stop, isSpeaking } = useSpeak(lang);

  const {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    lang,
    onTranscriptReady: useCallback((text: string) => {
      if (text) submitMessageRef.current(text);
    }, []),
  });

  const submitMessage = useCallback(
    async (textToSend: string) => {
      const text = textToSend.trim();
      if (!text) return;

      setInput("");
      resetTranscript();
      if (isListening) stopListening();

      setMessages((prev) => [...prev, { role: "user", text }]);
      addMessage({ role: "user", text });
      addInterest(text);
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, lang }),
        });
        const data = await res.json();
        const reply = data.reply ?? "I'm here to help. What would you like to know?";
        const links = Array.isArray(data.links) ? data.links : [];
        const effectiveLang = data.effectiveLang as "en" | "ml" | undefined;
        setMessages((prev) => [...prev, { role: "rinpo", text: reply, links }]);
        addMessage({ role: "rinpo", text: reply });
        if (voiceOutput) speak(reply, effectiveLang);
        if (effectiveLang) setLang(effectiveLang);
        const intent = data.intent as string | undefined;
        if (intent === "reminders") openPhoneScreen("plans");
        if (intent === "cloud") openPhoneScreen("portal");
        if (intent === "support") openPhoneScreen("support");
        if (intent === "services" || intent === "customSoftware" || intent === "digitalMarketing" || intent === "aiAutomation") {
          openPhoneScreen("services");
        }
      } catch {
        const errMsg = "Sorry, I couldn't process that. Please try again or check your connection.";
        setMessages((prev) => [...prev, { role: "rinpo", text: errMsg }]);
        addMessage({ role: "rinpo", text: errMsg });
        if (voiceOutput) speak(errMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [isListening, voiceOutput, resetTranscript, stopListening, speak, lang, addMessage, addInterest, openPhoneScreen]
  );
  submitMessageRef.current = submitMessage;

  useEffect(() => {
    updatePreferences({ language: lang });
  }, [lang, updatePreferences]);

  // Keep welcome message in sync with language when switching
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === "rinpo") {
        const want = lang === "ml" ? WELCOME_ML : WELCOME_EN;
        if (prev[0].text !== want) return [{ ...prev[0], text: want }];
      }
      return prev;
    });
  }, [lang]);

  useEffect(() => {
    if (!initialPrompt) return;
    clearPendingChatPrompt();
    submitMessageRef.current(initialPrompt);
  }, [initialPrompt, clearPendingChatPrompt]);

  useEffect(() => {
    setRinpoState(isListening ? "listening" : isSpeaking ? "speaking" : "phone-out");
    return () => setRinpoState("floating");
  }, [isListening, isSpeaking, setRinpoState]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === "en" ? "ml" : "en"));
    stop();
  };

  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage(input);
  };

  const handleMicToggle = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handleStop = () => {
    if (isListening) stopListening(true);
    if (isSpeaking) stop();
  };

  const showStopButton = isListening || isSpeaking;

  const handleLinkClick = (href: string) => {
    stop();
    setPhoneOpen(false);
    router.push(href);
  };

  const toggleVoiceOutput = () => {
    updatePreferences({ voiceEnabled: !voiceOutput });
    if (voiceOutput) stop();
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 scrollbar-hide"
      >
        {messages.map((m, i) => {
          const isMalayalam = /[\u0D00-\u0D7F]/.test(m.text);
          const isUser = m.role === "user";
          return (
          <motion.div
            key={`rinpo-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
          >
            <span className="text-[10px] font-medium mb-0.5 text-white/60">{isUser ? "YOU" : "RINPO"}</span>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm text-[var(--rinads-white)] border ${
                isUser
                  ? "rounded-br-md bg-[var(--rinads-primary)]/30 border-[var(--rinads-primary)]/50"
                  : "rounded-bl-md bg-white/10 border-[var(--rinads-primary)]/30"
              }`}
            >
              <div className="flex items-start gap-2">
                <p className="flex-1 min-w-0 whitespace-pre-wrap">{m.text.replace(/\*\*(.*?)\*\*/g, "$1")}</p>
                {!isUser && (
                  <button
                    type="button"
                    onClick={() => speak(m.text, isMalayalam ? "ml" : undefined)}
                    className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                    aria-label="Play message"
                  >
                    <SpeakerIcon enabled={voiceOutput} />
                  </button>
                )}
              </div>
              {m.links && m.links.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.links.map((link) => (
                    <button
                      key={link.href + link.label}
                      type="button"
                      onClick={() => handleLinkClick(link.href)}
                      className="text-xs font-medium text-[var(--rinads-primary)] hover:underline underline-offset-2"
                    >
                      {link.label} →
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
          );
        })}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="rounded-2xl rounded-bl-md bg-white/10 border border-[var(--rinads-primary)]/30 px-3 py-2 text-sm text-white/70">
              {lang === "ml" ? "RINPO ടൈപ്പ് ചെയ്യുന്നു…" : "RINPO is typing…"}
            </div>
          </motion.div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-white/10 safe-area-inset-bottom">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <button
            type="button"
            onClick={toggleLanguage}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors ${
              lang === "ml" ? "text-[var(--rinads-primary)] bg-[var(--rinads-primary)]/10" : "text-white/50 hover:text-white/70"
            }`}
            title={lang === "en" ? "Switch to Malayalam" : "Switch to English"}
          >
            {lang === "en" ? "EN" : "മലയാളം"}
          </button>
          <button
            type="button"
            onClick={toggleVoiceOutput}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors ${
              voiceOutput ? "text-[var(--rinads-primary)] bg-[var(--rinads-primary)]/10" : "text-white/50 hover:text-white/70"
            }`}
            title={voiceOutput ? "Voice output on (click to turn off)" : "Voice output off (click to turn on)"}
          >
            <SpeakerIcon enabled={voiceOutput} />
            {voiceOutput ? "Voice on" : "Voice off"}
          </button>
        </div>
        {showStopButton && (
          <button
            type="button"
            onClick={handleStop}
            className="mb-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-400/50 text-sm font-medium hover:bg-red-500/30 transition-colors"
            aria-label="Stop"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            Stop
          </button>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lang === "ml" ? "ടൈപ്പ് അല്ലെങ്കിൽ പറയുക..." : "Type or say something..."}
            className="flex-1 min-w-0 rounded-xl bg-white/5 border border-[var(--rinads-primary)]/50 px-3 py-2.5 sm:py-2 text-base sm:text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--rinads-primary)]"
          />
          {isSupported && (
            <button
              type="button"
              onClick={handleMicToggle}
              className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-colors ${
                isListening
                  ? "bg-red-500/20 text-red-400 border border-red-400/50"
                  : "bg-white/5 border border-[var(--rinads-primary)]/50 text-white hover:bg-white/10"
              }`}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
              <MicIcon isListening={isListening} />
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-[var(--rinads-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--rinads-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <p className="text-[10px] text-white/50 mt-1">
          {isSupported
            ? lang === "ml"
              ? "വോയ്സ് ഇൻപുട്ടിന് മൈക്ക് ടാപ്പ് ചെയ്യുക • വോയ്സ് ഓണായിരിക്കുമ്പോൾ RINPO മറുപടി പറയും"
              : "Tap mic for voice input • RINPO speaks replies when Voice is on"
            : lang === "ml"
              ? "വോയ്സ് ഇൻപുട്ടിന് Chrome, Edge അല്ലെങ്കിൽ Safari ആവശ്യമാണ്"
              : "Voice input requires Chrome, Edge, or Safari"}
        </p>
      </form>
    </div>
  );
}
