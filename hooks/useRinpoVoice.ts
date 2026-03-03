"use client";

import { useCallback, useRef, useState } from "react";

export const RINPO_WELCOME_SPEECH = `Hi… Welcome to Rinads. I am Rinpo.

Some people call me "AI Assistant"… some say "AI Chat Bot"… But you can just call me Rinpo.

I'm here to guide you into the world of Rinads — where business becomes simple, smooth, and stress-free.

At Rinads, we stand by one powerful principle: Business Simplified.

No matter what your business is… we are here for you.

Are you running a Salon & Spa? Managing an Accounting Firm? Growing a Digital Marketing Agency? An Architect managing projects? A Doctor running a clinic or hospital? Or maybe you are manufacturing Footwear… or creating beautiful Essential Oils…

Whatever you do… Whatever your industry… We've got you covered.

Rinads offers: Ready-Made Software – Quick to start, easy to use, industry-focused. Custom Software Solutions – Built exactly the way your business works.

You choose what feels comfortable. We adapt to you.

We help you automate your operations — from appointments, billing, accounting, inventory, payroll, CRM, production tracking… all the way down to the finest details.

Less paperwork. Less confusion. Less stress.

More clarity. More control. More growth.

With Rinads, your business runs smarter — while you focus on what truly matters: serving your customers and expanding your vision.

Come… Let me take you step by step into the Rinads ecosystem.

Because when technology works for you… Business truly becomes simplified.`;

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
