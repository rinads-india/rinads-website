"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/rinads/Logo";
import { useRinpo, type RinpoState } from "./RinpoProvider";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRinpoVoice } from "@/hooks/useRinpoVoice";
import { RinpoGuideHint } from "./RinpoGuideArrow";
import { MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const RINPO_AVATAR = "/assets/rinpo-avatar.png";
const RINPO_INTRO_BG = "/assets/rinpo-intro-bg.png";

function SpeechPanels({
  words,
  currentWordIndex,
  isSpeaking,
}: {
  words: string[];
  currentWordIndex: number;
  isSpeaking: boolean;
}) {
  const mid = Math.ceil(words.length / 2);
  const leftWords = words.slice(0, mid);
  const rightWords = words.slice(mid, words.length);
  const WINDOW = 5;

  const renderSide = (sideWords: string[], startIdx: number, isRight: boolean) => {
    const activeIdx = isRight ? currentWordIndex - mid : currentWordIndex;
    const from = Math.max(0, activeIdx - WINDOW);
    const to = Math.min(sideWords.length, activeIdx + WINDOW + 1);
    const visible = sideWords.slice(from, to);

    return (
      <div
        className={`w-[min(200px,28vw)] flex flex-col gap-1 ${isRight ? "items-end" : ""}`}
      >
        {visible.map((word, idx) => {
          const i = startIdx + from + idx;
          const isActive = i === currentWordIndex && isSpeaking;
          const isPast = i < currentWordIndex;
          return (
            <motion.span
              key={`${isRight ? "R" : "L"}-${i}`}
              className={`text-sm sm:text-base font-semibold select-none ${
                isActive ? "text-[var(--rinads-primary)]" : isPast ? "text-white/70" : "text-white/30"
              }`}
              animate={{
                opacity: isActive ? 1 : isPast ? 0.85 : 0.4,
                scale: isActive ? 1.15 : 1,
                x: isActive ? (isRight ? 4 : -4) : 0,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={
                isActive
                  ? {
                      textShadow: "0 0 16px var(--rinads-glow), 0 0 32px rgba(159,75,199,0.5)",
                      filter: "drop-shadow(0 0 8px var(--rinads-primary))",
                    }
                  : undefined
              }
            >
              {word}
            </motion.span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-[6] pointer-events-none flex justify-between items-center px-6 sm:px-10 md:px-14">
      {renderSide(leftWords, 0, false)}
      {renderSide(rightWords, mid, true)}
    </div>
  );
}

const stateLabels: Record<RinpoState, string> = {
  idle: "Tap me — RINADS Intelligence",
  listening: "Listening…",
  speaking: "Speaking…",
  "phone-out": "Here's your RINADS phone.",
  floating: "Chat • Voice • Always here",
};

export function RinpoCharacter() {
  const {
    togglePhone,
    rinpoState,
    isIntroMode,
    setIntroComplete,
    rinpoGuide,
    advanceGuide,
    dismissGuide,
    setLoginModalOpen,
    setLoginModalMode,
    navMenuOpen,
  } = useRinpo();

  const isIdle = rinpoState === "idle" || rinpoState === "floating";
  const isListening = rinpoState === "listening";
  const isSpeaking = rinpoState === "speaking";
  const isPhoneOut = rinpoState === "phone-out";

  if (isIntroMode) {
    return (
      <RinpoIntroView
        onEnter={() => { setIntroComplete(true); advanceGuide(); }}
        onTapRinpo={togglePhone}
        rinpoState={rinpoState}
        isIdle={isIdle}
        isListening={isListening}
        isSpeaking={isSpeaking}
      />
    );
  }

  return (
    <>
      <RinpoGuideHint
        guideId={navMenuOpen ? null : rinpoGuide}
        onDismiss={dismissGuide}
        onActivate={() => {
          if (rinpoGuide === "account") {
            setLoginModalMode("login");
            setLoginModalOpen(true);
          } else if (rinpoGuide === "tap-rinpo") {
            togglePhone();
          }
        }}
      />
      <RinpoFloatingWidget
        hidden={navMenuOpen}
        togglePhone={() => { togglePhone(); dismissGuide(); }}
        rinpoState={rinpoState}
        isIdle={isIdle}
        isListening={isListening}
        isSpeaking={isSpeaking}
        isPhoneOut={isPhoneOut}
      />
    </>
  );
}

function RinpoIntroView({
  onEnter,
  onTapRinpo,
}: {
  onEnter: () => void;
  onTapRinpo: () => void;
  rinpoState: RinpoState;
  isIdle?: boolean;
  isListening?: boolean;
  isSpeaking?: boolean;
}) {
  const { speak, stop, isSpeaking: voiceSpeaking, currentWordIndex, words } = useRinpoVoice();

  useEffect(() => {
    speak();
    return () => stop();
  }, [speak, stop]);

  const isTalking = voiceSpeaking;
  const touchStartY = useRef(0);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0) onEnter();
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (dy > 50) onEnter(); // Swipe up = scroll down
  };

  return (
    <motion.div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0a0a0a 0%, #0d0512 30%, #12081a 60%, #0a0a0a 100%)",
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Full-scene background from uploaded design */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${RINPO_INTRO_BG})` }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, transparent 0%, rgba(10,10,10,0.3) 50%, rgba(10,10,10,0.6) 100%)",
        }}
      />
      {/* RINADS logo in background — blended into bg, no speaker */}
      <div className="absolute top-6 left-6 z-[1] opacity-60 drop-shadow-[0_0_24px_var(--rinads-glow)]">
        <Logo className="h-6 sm:h-7" />
      </div>

      {/* Talking animation: pulsing glow around RINPO (center) when speaking */}
      <AnimatePresence>
        {isTalking && (
          <motion.div
            key="rinpo-talking"
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-64 h-64 sm:w-80 sm:h-80 rounded-full"
              style={{
                background: "radial-gradient(ellipse at center, var(--rinads-glow) 0%, transparent 70%)",
              }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated speech text — left and right of RINPO */}
      <SpeechPanels words={words} currentWordIndex={currentWordIndex} isSpeaking={voiceSpeaking} />

      {/* Lip-sync effect: mouth pulse when speaking */}
      {voiceSpeaking && (
        <motion.div
          className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-16 h-8 rounded-full bg-[var(--rinads-primary)]/30 blur-sm"
            style={{ marginBottom: "8%" }}
            animate={{
              scaleX: [1, 1.3, 1],
              scaleY: [1, 0.6, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 0.25, repeat: Infinity, repeatType: "reverse" }}
          />
        </motion.div>
      )}

      {/* Tap target — RINPO is in the background image, tap anywhere to open */}
      <button
        type="button"
        onClick={onTapRinpo}
        className="absolute inset-0 z-10 cursor-pointer"
        aria-label="Tap RINPO — Open RINADS Intelligence"
      />

      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-6 pb-6 pt-24">
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            type="button"
            onClick={onEnter}
            className="px-6 py-2 rounded-xl bg-[var(--rinads-primary)]/80 hover:bg-[var(--rinads-primary)] text-white text-sm font-medium transition-colors pointer-events-auto"
          >
            Skip intro
          </button>
          <span className="text-sm sm:text-base text-white font-medium drop-shadow-md">or scroll down</span>
          <motion.span
            className="text-2xl text-white drop-shadow-md"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ↓
          </motion.span>
          <span className="text-[10px] sm:text-xs text-white/90 drop-shadow-md">Assisted by RINPO</span>
        </motion.div>

        {/* Footer */}
        <footer className="text-center pointer-events-none">
          <p className="text-[10px] sm:text-xs text-white/80 tracking-wide drop-shadow-md px-4">
            RINPO ASSISTED RINADS INTELLIGENCE POWERED BY RINADS TECHNOLOGIES
          </p>
        </footer>
      </div>
    </motion.div>
  );
}

/** Approximate widget footprint used to compute the "emerge from the O" travel path. */
const WIDGET_WIDTH_PX = 132;
const WIDGET_HEIGHT_PX = 168;
const REST_RIGHT_PX = 16;
const REST_BOTTOM_PX = 24;

function useHeroEmergeMotion(enabled: boolean) {
  const { scrollY } = useScroll();
  const [metrics, setMetrics] = useState({
    dx: 0,
    dy: 0,
    startScale: 0.38,
    threshold: 1,
    ready: !enabled,
  });

  useEffect(() => {
    if (!enabled) return;
    const measure = () => {
      const restCenterX = window.innerWidth - REST_RIGHT_PX - WIDGET_WIDTH_PX / 2;
      const restCenterY = window.innerHeight - REST_BOTTOM_PX - WIDGET_HEIGHT_PX / 2;
      const orb = document.querySelector<HTMLElement>("[data-rinpo-orb]");
      let originX = window.innerWidth / 2;
      let originY = window.innerHeight / 2;
      let startScale = 0.38;
      if (orb) {
        const box = orb.getBoundingClientRect();
        originX = box.left + box.width / 2;
        originY = box.top + box.height / 2;
        startScale = Math.min(box.width / WIDGET_WIDTH_PX, box.height / WIDGET_HEIGHT_PX) * 0.92;
      }
      setMetrics({
        dx: originX - restCenterX,
        dy: originY - restCenterY,
        startScale: Math.max(0.28, Math.min(startScale, 0.72)),
        threshold: Math.max(window.innerHeight * 0.7, 1),
        ready: true,
      });
    };
    const frame = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [enabled]);

  const x = useTransform(scrollY, [0, metrics.threshold], [enabled ? metrics.dx : 0, 0]);
  const y = useTransform(scrollY, [0, metrics.threshold], [enabled ? metrics.dy : 0, 0]);
  const scale = useTransform(
    scrollY,
    [0, metrics.threshold * 0.85],
    [enabled ? metrics.startScale : 1, 1]
  );
  const opacity = useTransform(scrollY, [0, metrics.threshold * 0.12], [enabled ? 0.95 : 1, 1]);
  const settled = useTransform(scrollY, [metrics.threshold * 0.55, metrics.threshold], [0, 1]);

  return { x, y, scale, opacity, settled, ready: metrics.ready };
}

function RinpoFloatingWidget({
  hidden,
  togglePhone,
  rinpoState,
  isIdle,
  isListening,
  isSpeaking,
  isPhoneOut,
}: {
  hidden: boolean;
  togglePhone: () => void;
  rinpoState: RinpoState;
  isIdle: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isPhoneOut: boolean;
}) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const emergeEnabled = (pathname === "/" || pathname == null) && !prefersReducedMotion;
  const { x, y, scale, opacity, settled, ready } = useHeroEmergeMotion(emergeEnabled);

  return (
    <motion.div
      className={`group fixed z-40 flex flex-col items-end gap-1 safe-area-inset-right safe-area-inset-bottom ${
        hidden ? "pointer-events-none" : ""
      }`}
      style={{
        right: "max(16px, env(safe-area-inset-right, 16px))",
        bottom: "max(24px, env(safe-area-inset-bottom, 24px))",
        x,
        y,
        scale,
        opacity: hidden || (emergeEnabled && !ready) ? 0 : opacity,
      }}
      transition={{ type: "spring", damping: 22, stiffness: 180 }}
      aria-hidden={hidden}
    >
      {/* Attention sparkles — only once RINPO has left the O and settled. */}
      <motion.span
        className="pointer-events-none absolute -top-1 right-2 h-1.5 w-1.5 rounded-full bg-purple-300"
        style={{ opacity: settled }}
        animate={{ y: [0, -14, -22], x: [0, 6, 10] }}
        transition={{ duration: 3.4, repeat: Infinity, repeatDelay: 1.6, ease: "easeOut" }}
        aria-hidden
      />
      <motion.span
        className="pointer-events-none absolute top-4 right-10 h-1 w-1 rounded-full bg-fuchsia-300"
        style={{ opacity: settled }}
        animate={{ y: [0, -10, -18], x: [0, -8, -14] }}
        transition={{ duration: 3.8, repeat: Infinity, repeatDelay: 2.4, delay: 0.6, ease: "easeOut" }}
        aria-hidden
      />

      <motion.button
        type="button"
        onClick={togglePhone}
        className="group relative flex flex-col items-center rounded-3xl bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rinads-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        aria-label="Open RINADS Intelligence — chat with RINPO"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
      >
        {/* Grounding glow so the cut-out character doesn't float untethered — no hard-edged box. */}
        <motion.span
          className="pointer-events-none absolute bottom-1 left-1/2 h-6 w-20 -translate-x-1/2 rounded-[50%] blur-md sm:w-24"
          style={{ background: "var(--rinads-glow)" }}
          animate={{ opacity: isListening || isSpeaking ? [0.6, 0.9, 0.6] : [0.35, 0.55, 0.35] }}
          transition={{ duration: isListening || isSpeaking ? 1.2 : 3, repeat: Infinity }}
          aria-hidden
        />
        <motion.div
          className="relative flex h-36 w-28 items-end justify-center sm:h-40 sm:w-32 md:h-44 md:w-36"
          animate={
            isIdle
              ? { y: [0, -5, 0, 0, 0, 0, -3, 3, -2, 0], rotate: [0, 0, 0, 0, 0, 0, -4, 4, -2, 0] }
              : isListening
                ? { scale: [1, 1.03, 1] }
                : isSpeaking
                  ? { scale: [1, 1.04, 1] }
                  : isPhoneOut
                    ? { rotateZ: [-2, 2, -2] }
                    : {}
          }
          transition={{
            duration: isIdle ? 6.4 : 1.2,
            repeat: Infinity,
            repeatType: isIdle ? "loop" : "reverse",
            times: isIdle ? [0, 0.08, 0.16, 0.5, 0.58, 0.66, 0.74, 0.82, 0.9, 1] : undefined,
          }}
        >
          <Image
            src={RINPO_AVATAR}
            alt="RINPO, the RINADS assistant"
            width={471}
            height={1334}
            priority={false}
            className="h-full w-full object-contain drop-shadow-[0_0_32px_rgba(159,75,199,0.55)]"
          />
          {(isListening || isSpeaking) && (
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background: "radial-gradient(ellipse at center, var(--rinads-glow) 0%, transparent 70%)",
              }}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              aria-hidden
            />
          )}
          {/* Chat-bubble attractor badge — hidden while RINPO is still inside the O. */}
          <motion.span
            className="pointer-events-none absolute -right-1 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rinads-primary text-white shadow-[0_0_16px_rgba(159,75,199,0.75)] sm:h-7 sm:w-7"
            style={{ opacity: settled }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          >
            <MessageCircle size={13} className="sm:hidden" />
            <MessageCircle size={14} className="hidden sm:block" />
          </motion.span>
        </motion.div>
      </motion.button>
      {/* Label blends into the background — no boxy pill, just soft text that appears on intent. */}
      <p className="hidden max-w-[9.5rem] text-right text-[11px] font-medium leading-tight text-white/0 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)] transition-colors duration-200 group-hover:text-white/90 group-focus-within:text-white/90 sm:block sm:text-xs">
        {stateLabels[rinpoState]}
      </p>
    </motion.div>
  );
}
