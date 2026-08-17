"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "rinads_os_guides_seen";

export function useOsGuide() {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(SEEN_KEY) === "1") return;

    const timer = window.setTimeout(() => setShowHint(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showHint) return;
    const timer = window.setTimeout(() => {
      setShowHint(false);
      try {
        window.localStorage.setItem(SEEN_KEY, "1");
      } catch {
        // ignore storage failures
      }
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [showHint]);

  useEffect(() => {
    if (!showHint) return;
    const nav = document.querySelector("[data-os-guide='dashboard']");
    if (!nav) return;
    nav.classList.add("ring-2", "ring-rinads-primary", "ring-offset-2");
    return () => {
      nav.classList.remove("ring-2", "ring-rinads-primary", "ring-offset-2");
    };
  }, [showHint]);
}
