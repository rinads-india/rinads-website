"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AvatarCall,
  AvatarVideo,
  ControlBar,
  clientTool,
  useAvatarSession,
  useClientEvent,
  useLocalMedia,
  useTranscript,
  type SessionCredentials,
  type TranscriptionEntry,
} from "@runwayml/avatars-react";
import "@runwayml/avatars-react/styles.css";
import { ExternalLink, Loader2, Mic, Volume2, VolumeX } from "lucide-react";
import {
  DEFAULT_LIVE_LANGUAGE,
  LIVE_LANGUAGES,
  getLiveLanguage,
  type LiveLanguageCode,
} from "@/lib/rinpo-live/languages";
import {
  SUGGEST_LINK_TOOL,
  SUGGEST_LINK_TOOL_NAME,
  resolveSuggestedLink,
  type SuggestLinkArgs,
} from "@/lib/rinpo-live/tools";
import { formatClock, speakerOf } from "@/lib/rinpo-live/transcript";

const IDLE_VIDEO = "/assets/rinpo-live-idle.mp4";
const POSTER = "/assets/rinpo-live-poster.jpg";
/** Character footage is 1088×704 — keep the stage at that ratio. */
const STAGE_STYLE = { aspectRatio: "1088 / 704" } as const;

const suggestLinkEvent = clientTool(SUGGEST_LINK_TOOL_NAME, {
  description: SUGGEST_LINK_TOOL.description,
  args: {} as SuggestLinkArgs,
});

type SuggestedLink = { key: string; label: string; href: string };
type Capability = "loading" | "enabled" | "disabled";
type Phase = "idle" | "live" | "ended";

/** An error whose message is safe to show to the visitor (it came from our API). */
class LiveStartError extends Error {}

const GENERIC_ERROR = "The live connection dropped. Please try again.";

async function requestSession(
  language: LiveLanguageCode,
): Promise<{ credentials: SessionCredentials; maxDurationSeconds: number }> {
  const response = await fetch("/api/rinpo/live", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language }),
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new LiveStartError(
      typeof data.error === "string" ? data.error : "RINPO Live could not start.",
    );
  }
  return {
    credentials: {
      sessionId: String(data.sessionId),
      serverUrl: String(data.serverUrl),
      token: String(data.token),
      roomName: String(data.roomName),
    },
    maxDurationSeconds: Number(data.maxDurationSeconds) || 180,
  };
}

function IdleStage({ capability }: { capability: Capability }) {
  const [showIntro, setShowIntro] = useState(false);

  return (
    <div className="relative w-full bg-white" style={STAGE_STYLE}>
      {showIntro ? (
        // The recording is opt-in and labelled: the live conversation is the product.
        <video
          className="h-full w-full object-cover"
          src={IDLE_VIDEO}
          poster={POSTER}
          autoPlay
          playsInline
          controls
          onEnded={() => setShowIntro(false)}
          aria-label="Recorded introduction from RINPO"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- fixed 1088×704 poster, no layout shift
        <img
          className="h-full w-full object-cover"
          src={POSTER}
          alt="RINPO, the RINADS character, ready to talk"
        />
      )}

      <span
        className={
          capability === "enabled"
            ? "absolute bottom-3 left-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
            : "absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white"
        }
      >
        {showIntro
          ? "Recorded intro"
          : capability === "enabled"
            ? "Live · ready to talk"
            : capability === "loading"
              ? "Checking live availability…"
              : "Live call not enabled yet"}
      </span>

      <button
        type="button"
        onClick={() => setShowIntro((value) => !value)}
        className="absolute right-3 top-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-black/10 bg-white/85 px-4 py-2 text-xs font-semibold text-[var(--text-primary)] backdrop-blur transition hover:bg-white"
        aria-pressed={showIntro}
      >
        {showIntro ? <VolumeX size={16} aria-hidden /> : <Volume2 size={16} aria-hidden />}
        {showIntro ? "Back to live" : "Watch recorded intro"}
      </button>
    </div>
  );
}

function CallOverlay({
  maxSeconds,
  onTranscript,
  onLink,
}: {
  maxSeconds: number;
  onTranscript: (entries: TranscriptionEntry[]) => void;
  onLink: (link: SuggestedLink) => void;
}) {
  const session = useAvatarSession();
  const { micError } = useLocalMedia();
  const transcript = useTranscript({ interim: true });
  const [elapsed, setElapsed] = useState(0);
  const { state, end } = session;
  // Derived, not seeded: `maxSeconds` only arrives after `connect()` resolves,
  // which is after this overlay first mounts (during the connecting phase).
  const remaining = maxSeconds - elapsed;

  useEffect(() => {
    if (state !== "active") return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [state]);

  useEffect(() => {
    if (remaining <= 0 && state === "active") void end();
  }, [remaining, state, end]);

  useEffect(() => {
    onTranscript(transcript);
  }, [transcript, onTranscript]);

  const handleSuggestLink = useCallback(
    (args: SuggestLinkArgs) => {
      const link = resolveSuggestedLink(args);
      if (link) onLink(link);
    },
    [onLink],
  );
  useClientEvent(suggestLinkEvent, handleSuggestLink);

  const connecting = state === "idle" || state === "connecting";
  const recent = transcript.slice(-2);

  return (
    <>
      <div className="pointer-events-none absolute left-3 top-3 z-[3] flex items-center gap-2">
        <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {connecting ? "Connecting…" : `Live · ${formatClock(remaining)} left`}
        </span>
      </div>

      {connecting ? (
        <div
          className="absolute inset-0 z-[3] flex items-center justify-center bg-black/30 text-white"
          role="status"
        >
          <Loader2 className="animate-spin" size={28} aria-hidden />
          <span className="sr-only">Connecting to RINPO</span>
        </div>
      ) : null}

      {micError ? (
        <p
          className="absolute inset-x-3 top-14 z-[3] rounded-xl bg-amber-100 px-4 py-2 text-xs font-medium text-amber-900"
          role="alert"
        >
          Microphone access is blocked. Allow it in your browser to talk — captions
          will still appear.
        </p>
      ) : null}

      {recent.length > 0 ? (
        <div
          className="absolute inset-x-3 bottom-20 z-[3] space-y-1"
          aria-live="polite"
        >
          {recent.map((entry) => (
            <p
              key={entry.id}
              dir="auto"
              className={
                speakerOf(entry) === "visitor"
                  ? "ml-auto w-fit max-w-[85%] rounded-2xl bg-white/90 px-3 py-1.5 text-sm text-[var(--text-primary)]"
                  : "mr-auto w-fit max-w-[85%] rounded-2xl bg-black/70 px-3 py-1.5 text-sm text-white"
              }
            >
              {entry.text}
            </p>
          ))}
        </div>
      ) : null}

      <ControlBar showCamera={false} showScreenShare={false} />
    </>
  );
}

function LiveCall({
  language,
  onTranscript,
  onLink,
  onEnd,
  onError,
}: {
  language: LiveLanguageCode;
  onTranscript: (entries: TranscriptionEntry[]) => void;
  onLink: (link: SuggestedLink) => void;
  onEnd: () => void;
  onError: (message: string) => void;
}) {
  const [maxSeconds, setMaxSeconds] = useState(180);

  const connect = useCallback(async () => {
    const { credentials, maxDurationSeconds } = await requestSession(language);
    setMaxSeconds(maxDurationSeconds);
    return credentials;
  }, [language]);

  return (
    <AvatarCall
      avatarId="rinpo"
      connect={connect}
      audio
      video={false}
      avatarImageUrl={POSTER}
      style={STAGE_STYLE}
      onEnd={onEnd}
      onError={(error) => {
        if (!(error instanceof LiveStartError)) console.error("[rinpo-live]", error);
        onError(error instanceof LiveStartError ? error.message : GENERIC_ERROR);
      }}
    >
      <AvatarVideo />
      <CallOverlay maxSeconds={maxSeconds} onTranscript={onTranscript} onLink={onLink} />
    </AvatarCall>
  );
}

function LinkCards({ links }: { links: SuggestedLink[] }) {
  if (links.length === 0) return null;
  return (
    <div className="mt-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        RINPO suggested
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.key}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-rinads-primary/40 bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-rinads-primary transition hover:bg-rinads-primary hover:text-white"
            >
              {link.label}
              <ExternalLink size={14} aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RinpoLive() {
  const [capability, setCapability] = useState<Capability>("loading");
  const [language, setLanguage] = useState<LiveLanguageCode>(DEFAULT_LIVE_LANGUAGE);
  const [phase, setPhase] = useState<Phase>("idle");
  const [callId, setCallId] = useState(0);
  const [activeLanguage, setActiveLanguage] = useState<LiveLanguageCode>(DEFAULT_LIVE_LANGUAGE);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<SuggestedLink[]>([]);
  const [transcript, setTranscript] = useState<TranscriptionEntry[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/rinpo/live", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { enabled?: boolean }) => {
        if (active) setCapability(data.enabled ? "enabled" : "disabled");
      })
      .catch(() => {
        if (active) setCapability("disabled");
      });
    return () => {
      active = false;
    };
  }, []);

  const start = () => {
    setError(null);
    setLinks([]);
    setTranscript([]);
    setActiveLanguage(language);
    setCallId((id) => id + 1);
    setPhase("live");
  };

  const handleLink = useCallback((link: SuggestedLink) => {
    setLinks((current) =>
      current.some((item) => item.key === link.key) ? current : [...current, link],
    );
  }, []);
  const handleTranscript = useCallback((entries: TranscriptionEntry[]) => {
    setTranscript(entries);
  }, []);
  // A failed connection reports onError (→ idle); don't let a trailing onEnd overwrite it.
  const handleEnd = useCallback(
    () => setPhase((current) => (current === "live" ? "ended" : current)),
    [],
  );
  const handleError = useCallback((message: string) => {
    setError(message);
    setPhase("idle");
  }, []);

  const live = phase === "live";
  const enabled = capability === "enabled";

  return (
    <div
      data-rinpo-live
      className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
    >
      {live ? (
        <LiveCall
          key={callId}
          language={activeLanguage}
          onTranscript={handleTranscript}
          onLink={handleLink}
          onEnd={handleEnd}
          onError={handleError}
        />
      ) : (
        <IdleStage capability={capability} />
      )}

      <div className="p-5 md:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Language
        </p>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Conversation language">
          {LIVE_LANGUAGES.map((item) => {
            const selected = (live ? activeLanguage : language) === item.code;
            return (
              <button
                key={item.code}
                type="button"
                disabled={live}
                aria-pressed={selected}
                onClick={() => setLanguage(item.code)}
                className={
                  selected
                    ? "min-h-11 rounded-full bg-rinads-primary px-4 py-2 text-xs font-semibold text-white disabled:opacity-90"
                    : "min-h-11 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] disabled:opacity-50"
                }
              >
                {item.nativeLabel}
                {item.support === "beta" ? (
                  <span className="ml-1.5 rounded bg-black/10 px-1 py-0.5 text-[9px] uppercase tracking-wide">
                    Beta
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
          {live
            ? `Talking in ${getLiveLanguage(activeLanguage).label}. To change language, end the call and pick again.`
            : "Pick English or Malayalam, or leave Auto and speak either — RINPO follows you. Malayalam is in beta, so pronunciation may be less polished."}
        </p>

        {!live ? (
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={start}
              disabled={!enabled}
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_0_35px_rgba(159,75,199,0.35)] transition hover:bg-rinads-primary-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <Mic size={18} aria-hidden />
              {phase === "ended" ? "Talk to RINPO again" : "Talk to RINPO live"}
            </button>
            {capability === "loading" ? (
              <span className="text-xs text-[var(--text-muted)]">Checking availability…</span>
            ) : null}
          </div>
        ) : null}

        {capability === "disabled" ? (
          <p className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--text-muted)]">
            Live video conversation is not enabled on this deployment yet, so RINPO can&apos;t talk
            back right now. You can watch a recorded intro meanwhile; RINPO chat and browser voice
            remain available.
          </p>
        ) : null}

        {error ? (
          <p
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {!live && enabled ? (
          <p className="mt-4 max-w-2xl text-xs leading-5 text-[var(--text-muted)]">
            You&apos;re talking with an AI character, not a person. Your microphone is used during
            the call, and the conversation may be transcribed to improve answers. Please don&apos;t
            share passwords, card numbers or other sensitive details.
          </p>
        ) : null}

        <LinkCards links={links} />

        {phase === "ended" && transcript.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Conversation
            </p>
            <ul className="mt-2 space-y-2 text-sm leading-6" dir="auto">
              {transcript
                .filter((entry) => entry.final)
                .map((entry) => (
                  <li key={entry.id}>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {speakerOf(entry) === "visitor" ? "You" : "RINPO"}:
                    </span>{" "}
                    <span className="text-[var(--text-secondary)]">{entry.text}</span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
