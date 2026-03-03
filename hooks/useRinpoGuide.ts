"use client";

import { useState, useCallback, useEffect } from "react";

export type RinpoGuideId = "scroll-down" | "account" | "tap-rinpo" | null;

const GUIDE_SEQUENCE: RinpoGuideId[] = ["scroll-down", "account", "tap-rinpo"];

export function useRinpoGuide(isIntroMode: boolean, introComplete: boolean) {
  const [currentGuide, setCurrentGuide] = useState<RinpoGuideId>(null);
  const [, setGuideIndex] = useState(0);

  const advanceGuide = useCallback(() => {
    setGuideIndex((i) => {
      const next = i + 1;
      if (next >= GUIDE_SEQUENCE.length) {
        setCurrentGuide(null);
        return i;
      }
      setCurrentGuide(GUIDE_SEQUENCE[next]);
      return next;
    });
  }, []);

  const dismissGuide = useCallback(() => {
    setCurrentGuide(null);
  }, []);

  useEffect(() => {
    if (isIntroMode) {
      setCurrentGuide("scroll-down"); // eslint-disable-line react-hooks/set-state-in-effect -- sync with isIntroMode
      setGuideIndex(0);
    }
  }, [isIntroMode]);

  useEffect(() => {
    if (!isIntroMode && introComplete) {
      setCurrentGuide("account"); // eslint-disable-line react-hooks/set-state-in-effect -- sync with introComplete
      setGuideIndex(1);
    }
  }, [isIntroMode, introComplete]);

  return { currentGuide, advanceGuide, dismissGuide };
}
