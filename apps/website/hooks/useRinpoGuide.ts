"use client";

import { useState, useCallback, useEffect } from "react";

export type RinpoGuideId = "scroll-down" | "account" | "tap-rinpo" | null;

const GUIDE_SEQUENCE: RinpoGuideId[] = ["scroll-down", "account", "tap-rinpo"];

const SEEN_KEY = "rinads_rinpo_guides_seen";
/** Let the page settle before pointing at anything. */
const SHOW_DELAY_MS = 1500;
/** Hints are a nudge, not furniture — they retire on their own. */
const AUTO_DISMISS_MS = 7000;

function hasSeenGuides(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

function markGuidesSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Private mode / storage disabled — the hint simply shows again next visit.
  }
}

export function useRinpoGuide(isIntroMode: boolean, introComplete: boolean) {
  const [currentGuide, setCurrentGuide] = useState<RinpoGuideId>(null);
  const [, setGuideIndex] = useState(0);

  const dismissGuide = useCallback(() => {
    setCurrentGuide(null);
    markGuidesSeen();
  }, []);

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

  useEffect(() => {
    if (!isIntroMode) return;
    setCurrentGuide("scroll-down"); // eslint-disable-line react-hooks/set-state-in-effect -- sync with isIntroMode
    setGuideIndex(0);
  }, [isIntroMode]);

  // Point at the account control once, shortly after the first visit settles.
  useEffect(() => {
    if (isIntroMode || !introComplete || hasSeenGuides()) return;
    const show = window.setTimeout(() => {
      setCurrentGuide("account");
      setGuideIndex(1);
    }, SHOW_DELAY_MS);
    return () => window.clearTimeout(show);
  }, [isIntroMode, introComplete]);

  // Any hint outside the intro retires on a timer so it can never become permanent UI.
  useEffect(() => {
    if (!currentGuide || isIntroMode) return;
    const hide = window.setTimeout(dismissGuide, AUTO_DISMISS_MS);
    return () => window.clearTimeout(hide);
  }, [currentGuide, isIntroMode, dismissGuide]);

  return { currentGuide, advanceGuide, dismissGuide };
}
