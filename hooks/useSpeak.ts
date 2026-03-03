"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeechLang } from "./useSpeechRecognition";

const LANG_CODES: Record<SpeechLang, string> = {
  en: "en-US",
  ml: "ml-IN",
};

export function useSpeak(lang: SpeechLang = "en") {
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    if (synth.getVoices().length === 0) {
      synth.addEventListener("voiceschanged", () => synth.getVoices(), { once: true });
    }
  }, []);

  const speak = useCallback(
    (text: string, langOverride?: SpeechLang) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      const clean = text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
      if (!clean) return;

      const synth = window.speechSynthesis;
      synthRef.current = synth;
      synth.cancel();

      const useLang = langOverride ?? lang;
      const langCode = LANG_CODES[useLang];
      const langPrefix = langCode.split("-")[0];

      const doSpeak = () => {
        const voices = synth.getVoices();
        const preferred = voices.find((v) => v.lang.startsWith(langPrefix));
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.lang = langCode;
        if (preferred) utterance.voice = preferred;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synth.speak(utterance);
      };

      const voices = synth.getVoices();
      if (voices.length === 0) {
        synth.addEventListener("voiceschanged", function onVoicesReady() {
          synth.removeEventListener("voiceschanged", onVoicesReady);
          doSpeak();
        });
      } else {
        doSpeak();
      }
    },
    [lang]
  );

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, stop, isSpeaking };
}
