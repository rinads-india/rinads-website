"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { RinpoCharacter } from "./RinpoCharacter";
import { RinpoPhone } from "./RinpoPhone";
import { LoginModal } from "./LoginModal";
import { useRinpoGuide } from "@/hooks/useRinpoGuide";
import { useAuth } from "@/contexts/AuthContext";
import type { RinpoGuideId } from "@/hooks/useRinpoGuide";
import { RinpoMemoryProvider } from "@/hooks/useRinpoMemory";
import type { PhoneScreenId } from "./RinpoPhoneScreens";

export type RinpoState = "idle" | "listening" | "speaking" | "phone-out" | "floating";

type RinpoContextType = {
  phoneOpen: boolean;
  setPhoneOpen: (open: boolean) => void;
  togglePhone: () => void;
  rinpoState: RinpoState;
  setRinpoState: (state: RinpoState) => void;
  introComplete: boolean;
  setIntroComplete: (value: boolean) => void;
  isIntroMode: boolean;
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  loginModalMode: "login" | "signup";
  setLoginModalMode: (mode: "login" | "signup") => void;
  /** Set by the navbar so overlays can yield to the full-screen mobile menu. */
  navMenuOpen: boolean;
  setNavMenuOpen: (open: boolean) => void;
  phoneScreen: PhoneScreenId;
  openPhoneScreen: (screen: PhoneScreenId, prompt?: string) => void;
  pendingChatPrompt: string | null;
  clearPendingChatPrompt: () => void;
  rinpoGuide: RinpoGuideId;
  advanceGuide: () => void;
  dismissGuide: () => void;
};

const RinpoContext = createContext<RinpoContextType | null>(null);

export function useRinpo() {
  const ctx = useContext(RinpoContext);
  if (!ctx) throw new Error("useRinpo must be used within RinpoProvider");
  return ctx;
}

const INTRO_SCROLL_THRESHOLD = 0.5; // 50% of viewport

export function RinpoProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { login, signup, user } = useAuth();
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [rinpoState, setRinpoState] = useState<RinpoState>("idle");
  const [introComplete, setIntroComplete] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<"login" | "signup">("login");
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [phoneScreen, setPhoneScreen] = useState<PhoneScreenId>("chat");
  const [pendingChatPrompt, setPendingChatPrompt] = useState<string | null>(null);

  const isIntroMode = (pathname === "/" || pathname == null) && !introComplete;

  const { currentGuide: rinpoGuide, advanceGuide, dismissGuide } = useRinpoGuide(isIntroMode, introComplete);

  const togglePhone = useCallback(() => {
    setPhoneOpen((prev) => {
      const next = !prev;
      setRinpoState(next ? "phone-out" : "floating");
      return next;
    });
  }, []);

  const openPhoneScreen = useCallback((screen: PhoneScreenId, prompt?: string) => {
    setPhoneScreen(screen);
    if (prompt) setPendingChatPrompt(prompt);
    setPhoneOpen(true);
    setRinpoState("phone-out");
  }, []);

  const clearPendingChatPrompt = useCallback(() => setPendingChatPrompt(null), []);

  useEffect(() => {
    if (pathname !== "/") return;
    const onScroll = () => {
      const threshold = window.innerHeight * INTRO_SCROLL_THRESHOLD;
      if (window.scrollY > threshold) setIntroComplete(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return (
    <RinpoContext.Provider
      value={{
        phoneOpen,
        setPhoneOpen,
        togglePhone,
        rinpoState,
        setRinpoState,
        introComplete,
        setIntroComplete,
        isIntroMode,
        loginModalOpen,
        setLoginModalOpen,
        loginModalMode,
        setLoginModalMode,
        navMenuOpen,
        setNavMenuOpen,
        phoneScreen,
        openPhoneScreen,
        pendingChatPrompt,
        clearPendingChatPrompt,
        rinpoGuide,
        advanceGuide,
        dismissGuide,
      }}
    >
      <RinpoMemoryProvider key={user?.username ?? "Guest"}>
        {children}
        <RinpoCharacter />
        {phoneOpen && <RinpoPhone />}
        <LoginModal
          isOpen={loginModalOpen}
          initialMode={loginModalMode}
          onClose={() => setLoginModalOpen(false)}
          onLogin={login}
          onSignup={signup}
        />
      </RinpoMemoryProvider>
    </RinpoContext.Provider>
  );
}
