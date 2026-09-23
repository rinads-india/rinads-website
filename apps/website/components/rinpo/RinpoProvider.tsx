"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { RinpoCharacter } from "./RinpoCharacter";
import { RinpoPhone } from "./RinpoPhone";
import { LoginModal } from "./LoginModal";
import { useRinpoGuide } from "@/hooks/useRinpoGuide";
import { useAuth } from "@/contexts/AuthContext";
import type { RinpoGuideId } from "@/hooks/useRinpoGuide";
import { RinpoMemoryProvider } from "@/hooks/useRinpoMemory";
import type { PhoneScreenId } from "./RinpoPhoneScreens";
import {
  getRinpoPageContext,
  type RinpoExperienceState,
  type RinpoPageContext,
} from "@/lib/rinpo-experience";

/**
 * Legacy visual state retained while the character animation is migrated.
 * Product interaction state lives in RinpoExperienceState.
 */
export type RinpoState = "idle" | "listening" | "speaking" | "phone-out" | "floating";

type RinpoContextType = {
  phoneOpen: boolean;
  setPhoneOpen: (open: boolean) => void;
  togglePhone: () => void;
  closeRinpo: () => void;
  rinpoState: RinpoState;
  setRinpoState: (state: RinpoState) => void;
  interactionState: RinpoExperienceState;
  setInteractionState: (state: RinpoExperienceState) => void;
  pageContext: RinpoPageContext;
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

const INTRO_SCROLL_THRESHOLD = 0.5;

export function RinpoProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { login, signup, user } = useAuth();
  const [phoneOpen, setPhoneOpenState] = useState(false);
  const [rinpoState, setRinpoState] = useState<RinpoState>("idle");
  const [interactionState, setInteractionState] = useState<RinpoExperienceState>("closed");
  const [introComplete, setIntroComplete] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<"login" | "signup">("login");
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [phoneScreen, setPhoneScreen] = useState<PhoneScreenId>("chat");
  const [pendingChatPrompt, setPendingChatPrompt] = useState<string | null>(null);

  const isIntroMode = (pathname === "/" || pathname == null) && !introComplete;
  const isOsRoute = pathname?.startsWith("/os") ?? false;
  const pageContext = useMemo(() => getRinpoPageContext(pathname), [pathname]);

  const { currentGuide: rinpoGuide, advanceGuide, dismissGuide } = useRinpoGuide(
    isIntroMode,
    introComplete
  );

  const setPhoneOpen = useCallback((open: boolean) => {
    setPhoneOpenState(open);
    setInteractionState(open ? "open" : "closed");
    setRinpoState(open ? "phone-out" : "floating");
  }, []);

  const closeRinpo = useCallback(() => {
    setPhoneOpenState(false);
    setPendingChatPrompt(null);
    setInteractionState("closed");
    setRinpoState("floating");
  }, []);

  const togglePhone = useCallback(() => {
    setPhoneOpenState((prev) => {
      const next = !prev;
      setInteractionState(next ? "open" : "closed");
      setRinpoState(next ? "phone-out" : "floating");
      return next;
    });
  }, []);

  const openPhoneScreen = useCallback((screen: PhoneScreenId, prompt?: string) => {
    setPhoneScreen(screen);
    if (prompt) setPendingChatPrompt(prompt);
    setPhoneOpenState(true);
    setInteractionState("open");
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
        closeRinpo,
        rinpoState,
        setRinpoState,
        interactionState,
        setInteractionState,
        pageContext,
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
        {!isOsRoute && <RinpoCharacter />}
        {!isOsRoute && phoneOpen && <RinpoPhone />}
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
