"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type RinpoState = "idle" | "listening" | "speaking" | "phone-out" | "floating";

type RinpoContextType = {
  phoneOpen: boolean;
  setPhoneOpen: (open: boolean) => void;
  togglePhone: () => void;
  rinpoState: RinpoState;
  setRinpoState: (state: RinpoState) => void;
};

const RinpoContext = createContext<RinpoContextType | null>(null);

export function useRinpo() {
  const ctx = useContext(RinpoContext);
  if (!ctx) throw new Error("useRinpo must be used within RinpoProvider");
  return ctx;
}

export function RinpoProvider({ children }: { children: ReactNode }) {
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [rinpoState, setRinpoState] = useState<RinpoState>("idle");

  const togglePhone = useCallback(() => {
    setPhoneOpen((prev) => {
      const next = !prev;
      setRinpoState(next ? "phone-out" : "idle");
      return next;
    });
  }, []);

  return (
    <RinpoContext.Provider
      value={{
        phoneOpen,
        setPhoneOpen,
        togglePhone,
        rinpoState,
        setRinpoState,
      }}
    >
      {children}
      {/* Global RINPO + Phone overlay */}
      <RinpoCharacterAndPhone />
    </RinpoContext.Provider>
  );
}

function RinpoCharacterAndPhone() {
  const { phoneOpen } = useRinpo();
  return (
    <>
      <RinpoCharacter />
      {phoneOpen && <RinpoPhone />}
    </>
  );
}

// Lazy refs to avoid circular dependency; components defined below
import dynamic from "next/dynamic";
const RinpoCharacter = dynamic(() => import("./RinpoCharacter").then((m) => m.RinpoCharacter), {
  ssr: false,
});
const RinpoPhone = dynamic(() => import("./RinpoPhone").then((m) => m.RinpoPhone), { ssr: false });
