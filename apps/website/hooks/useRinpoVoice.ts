"use client";

import { useCallback, useRef, useState } from "react";

export const RINPO_WELCOME_SPEECH = `Hi. Welcome to RINADS. I'm RINPO.

RINADS is an AI operating platform for business. I am the character and interface that helps people understand the platform, ask questions, and find the right next step.

You can use RINADS to explore business operations, software, marketing, automation, creative work, logistics, learning, and industry configurations.

My public website experience includes chat and browser voice. Inside connected products, RINPO can also work with supported business context and registered tools.

Important actions still depend on the permissions, confirmation, approval, and runtime paths implemented by the product.

Start with what you want to run, build, grow, automate, create, or learn. I'll help you find the right path.`;

export type RinpoVoiceState = "idle" | "speaking" | "paused" | "ended";

const WORDS = RINPO_WELCOME_SPEECH.split(/\s+/).filter(Boolean);

export function useRinpoVoice() {
  const [state, setState] = useState<RinpoVoiceState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (isMuted) {
      setState("ended");
      return;
    }

    const synth = window.speechSynthesis;
    synthRef.current = synth;
    synth.cancel();
    setCurrentWordIndex(0);

    const utterance = new SpeechSynthesisUtterance(RINPO_WELCOME_SPEECH);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = "en-US";

    const voices = synth.getVoices();
    const preferred = voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    let fallbackTimer: ReturnType<typeof setInterval> | null = null;
    const avgMsPerWord = 220;

    utterance.onstart = () => {
      setState("speaking");
      fallbackTimer = setInterval(() => {
        setCurrentWordIndex((prev) => Math.min(prev + 1, WORDS.length));
      }, avgMsPerWord);
    };
    utterance.onend = () => {
      setState("ended");
      setCurrentWordIndex(WORDS.length);
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
    utterance.onpause = () => {
      setState("paused");
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
    utterance.onresume = () => setState("speaking");
    utterance.onerror = () => {
      setState("ended");
      if (fallbackTimer) clearInterval(fallbackTimer);
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, [isMuted]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setState("ended");
    }
  }, []);

  const mute = useCallback(() => {
    setIsMuted(true);
    stop();
  }, [stop]);

  const unmute = useCallback(() => {
    setIsMuted(false);
  }, []);

  return {
    state,
    isMuted,
    speak,
    stop,
    mute,
    unmute,
    isSpeaking: state === "speaking",
    currentWordIndex,
    words: WORDS,
  };
}
