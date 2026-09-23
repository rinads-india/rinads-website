"use client";

import { useCallback, useState } from "react";
import { ArrowRight, Mic, MicOff, Volume2, Waveform } from "lucide-react";
import {
  CTASection,
  MarketingPageShell,
  PageHero,
} from "@/components/system";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import {
  useSpeechRecognition,
  type SpeechLang,
} from "@/hooks/useSpeechRecognition";
import { useSpeak } from "@/hooks/useSpeak";

const VOICE_STATES = ["Idle", "Listening", "Understanding", "Responding"] as const;

export function VoiceClient() {
  const { openPhoneScreen, setInteractionState } = useRinpo();
  const [language, setLanguage] = useState<SpeechLang>("en");
  const [lastTranscript, setLastTranscript] = useState("");
  const { speak, stop, isSpeaking } = useSpeak(language);

  const onTranscriptReady = useCallback(
    (text: string) => {
      setLastTranscript(text);
      setInteractionState("thinking");
      openPhoneScreen("chat", text);
    },
    [openPhoneScreen, setInteractionState]
  );

  const {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    lang: language,
    onTranscriptReady,
  });

  const demoState = isListening
    ? "Listening"
    : isSpeaking
      ? "Responding"
      : lastTranscript
        ? "Understanding"
        : "Idle";

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      setInteractionState("open");
      return;
    }
    setLastTranscript("");
    setInteractionState("listening");
    startListening();
  };

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="RINPO Voice"
        headline="Speak to the RINADS interface."
        summary="RINPO Voice turns speech into a RINPO interaction. The public demo uses your browser's speech-recognition and speech-synthesis capabilities; production voice channels require their own supported runtime and provider integration."
        primaryHref="/rinpo"
        primaryLabel="RINPO overview"
        secondaryHref="/platform/rinads-intelligence"
        secondaryLabel="RINADS Intelligence"
      />

      <section className="px-6 pb-20 md:px-12 lg:px-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
              Browser voice demo
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">
              Voice is an input channel. RINPO remains the interface.
            </h2>
            <p className="mt-5 max-w-xl text-[var(--text-muted)]">
              Speak a prompt in supported browsers. When recognition finishes, the transcript is handed to the same persistent RINPO chat experience rather than a separate voice-only assistant.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {([
                ["en", "English"],
                ["ml", "Malayalam"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLanguage(value)}
                  className={
                    language === value
                      ? "rounded-full bg-rinads-primary px-4 py-2 text-xs font-semibold text-white"
                      : "rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)]"
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {!isSupported ? (
              <p className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--text-muted)]">
                Speech recognition is not available in this browser. RINPO chat remains available, and voice support can vary by browser, device, language, and operating system.
              </p>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-black p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rinads-primary">
                  Voice session
                </p>
                <p className="mt-1 text-sm text-white/50">
                  {language === "ml" ? "Malayalam · ml-IN" : "English · en-US"}
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white/60">
                {demoState}
              </span>
            </div>

            <div className="mt-8 flex min-h-[170px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center">
              <button
                type="button"
                onClick={toggleListening}
                disabled={!isSupported}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-rinads-primary text-white shadow-[0_0_45px_rgba(159,75,199,0.45)] transition hover:bg-rinads-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <MicOff size={30} aria-hidden /> : <Mic size={30} aria-hidden />}
              </button>
              <p className="mt-5 text-sm font-semibold">
                {isListening ? "Listening…" : "Tap the microphone and speak"}
              </p>
              <p className="mt-2 max-w-md text-xs leading-5 text-white/45">
                Audio processing and recognition behaviour depend on the browser's Web Speech implementation.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                Transcript
              </p>
              <p className="mt-2 min-h-10 text-sm leading-6 text-white/70">
                {transcript || lastTranscript || "Your recognized speech will appear here."}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  speak(
                    language === "ml"
                      ? "നമസ്കാരം. ഞാൻ RINPO. നിങ്ങൾക്ക് RINADS മനസ്സിലാക്കാനും ശരിയായ അടുത്ത ഘട്ടം കണ്ടെത്താനും ഞാൻ സഹായിക്കും."
                      : "Hi. I'm RINPO. I can help you understand RINADS and find the right next step."
                  )
                }
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/75 transition hover:border-rinads-primary/50 hover:text-white"
              >
                <Volume2 size={16} aria-hidden />
                Test browser voice
              </button>
              {isSpeaking ? (
                <button
                  type="button"
                  onClick={stop}
                  className="min-h-11 rounded-full px-4 py-2 text-sm font-semibold text-white/55 hover:text-white"
                >
                  Stop speech
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface-muted)] px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <Waveform size={23} className="text-rinads-primary" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">
              Interaction model
            </p>
          </div>

          <div className="mt-8 overflow-x-auto pb-2">
            <ol className="flex min-w-max items-center">
              {VOICE_STATES.map((state, index) => (
                <li key={state} className="flex items-center">
                  <span className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)]">
                    {state}
                  </span>
                  {index < VOICE_STATES.length - 1 ? (
                    <ArrowRight size={16} className="mx-2 text-rinads-primary/60" aria-hidden />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
            Voice does not create a new permission model. If a spoken request eventually maps to a product-side action, the same tool, authorization, confirmation, and audit boundaries still apply.
          </p>
        </div>
      </section>

      <CTASection
        headline="Speak. Understand. Continue with RINPO."
        summary="Use browser voice as an input to the persistent RINPO experience, with product actions remaining behind the platform's actual controls."
      />
    </MarketingPageShell>
  );
}
