"use client";

import { useCallback, useRef, useState } from "react";

// Web Speech API - not in all TS libs
interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResult;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionHook = {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: (skipSubmit?: boolean) => void;
  resetTranscript: () => void;
};

export type SpeechLang = "en" | "ml";

type UseSpeechRecognitionOptions = {
  lang?: SpeechLang;
  onTranscriptReady?: (text: string) => void;
};

const LANG_CODES: Record<SpeechLang, string> = {
  en: "en-US",
  ml: "ml-IN",
};

function getSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const SpeechRecognitionAPI =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;
  return !!SpeechRecognitionAPI;
}

export function useSpeechRecognition(options?: UseSpeechRecognitionOptions): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported] = useState(getSpeechRecognitionSupported);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef("");
  const skipSubmitRef = useRef(false);

  const startListening = useCallback(() => {
    if (typeof window === "undefined" || !isSupported) return;
    const SpeechRecognitionAPI =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI() as SpeechRecognitionInstance;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LANG_CODES[options?.lang ?? "en"];

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let finalPart = "";
      let interimPart = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i] as unknown as { isFinal: boolean; 0?: { transcript: string } };
        const text = (result[0]?.transcript ?? "").trim();
        if (!text) continue;
        if (result.isFinal) finalPart += (finalPart ? " " : "") + text;
        else interimPart += (interimPart ? " " : "") + text;
      }
      if (finalPart) {
        transcriptRef.current = (transcriptRef.current ? transcriptRef.current + " " : "") + finalPart;
      }
      setTranscript(interimPart ? transcriptRef.current + (transcriptRef.current ? " " : "") + interimPart : transcriptRef.current);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      let finalText = transcriptRef.current.trim();
      finalText = finalText.replace(/(\b[\w']+(?:\s+[\w']+)*)\s+\1+/gi, "$1").replace(/\s+/g, " ").trim();
      setIsListening(false);
      if (finalText && options?.onTranscriptReady && !skipSubmitRef.current) options.onTranscriptReady(finalText);
      skipSubmitRef.current = false;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript("");
    transcriptRef.current = "";
  }, [isSupported, options]);

  const stopListening = useCallback((skipSubmit = false) => {
    if (skipSubmit) skipSubmitRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    transcriptRef.current = "";
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  };
}
